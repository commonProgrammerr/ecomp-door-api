import express, { Request, response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { authMiddleware } from "./middleware/auth";
import { v4 as uuid4 } from "uuid";
const port = process.env.PORT || 3030;
const timeout = Number(process.env.TIMEOUT) || 6e5;
const secure_timeout = Number(process.env.SECURE_TIMEOUT) || 3e5;
const secure_password = process.env.PASSWORD || "poli é força";

const device_mac = "teste";
const device_ip = "poli";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.connectTimeout(timeout);
io.on("connect", (socket) => {
  setTimeout(() => {
    socket.emit("secure-timeout");
    socket.disconnect();
  }, secure_timeout);
});

app.use(express.json());
app.use(authMiddleware);

app.get("/login", (req, res) => {
  try {
    const { mac } = req.query;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (mac !== device_mac) {
      return res.status(400).json({
        message: "Invalid device id",
      });
    }

    if (ip !== device_ip) {
      return res.status(401).json({
        message: "Unsecure request",
        details: "Your location isn't aloewd to request a login",
      });
    }

    const login = uuid4();

    io.path(`/${login}`).on("connect", (connection) => {
      console.log(
        `${new Date().toISOString()}: ${mac} - ${ip} CONNECTED ON (${connection.id
        })'`
      );
      connection.on("disconnect", (_) => {
        console.log(
          `${new Date().toISOString()}: ${mac} - ${ip} DISCONNECTED FROM (${connection.id
          })'`
        );
      });
    });

    res.status(200).json({
      login,
    });
  } catch {
    res.status(500).json({
      message: "Internal error.",
    });
  }
});

type Req = Request<{
  login: string;
  password: string;
}>;

app.post("/open", (req: Req, res) => {
  const { login, password } = req.params;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (password !== secure_password || !ip) {
    return res.status(401).json({
      message: "Unsecure request",
      details: "Your app version is out of date. Please update it",
    });
  }

  if (io.path(login).emit("open", login, ip)) {
    console.log(`${new Date().toISOString()}: ${ip} REQUEST OPEN ON ${login}`);
    io.path(login).disconnectSockets();
  }
});
httpServer.listen(port, () =>
  console.log(
    `${new Date().toISOString()}: Server running at http://localhost:${port}/`
  )
);
