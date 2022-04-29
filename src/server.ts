import express, { Request, response } from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
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

app.get("/secret", (req, res) => {
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
        details: "Your location isn't aloewd to request a secret",
      });
    }

    const secret = uuid4();

    io.path(`/${secret}`).on("open", (socket_id, client_ip) => {
      console.info(
        `${new Date().toISOString()}: ${mac} OPEN ${ip} FROM ${client_ip} (${socket_id})'`
      );
    });

    res.status(200).json({
      secret,
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

  io.path(login).once('connect', socket => {
    socket.emit('open', login, ip)
  })

});
httpServer.listen(port, () =>
  console.log(
    `${new Date().toISOString()}: Server running at http://localhost:${port}/`
  )
);
