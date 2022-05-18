import express, { Request, response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { authMiddleware } from "./middleware/auth";
import { v4 as uuid4 } from "uuid";
const port = process.env.PORT || 3030;
const secure_timeout = Number(process.env.SECURE_TIMEOUT) || 12e4;
const secure_password = process.env.PASSWORD || "poli";

const device_mac = "4C:75:25:36:59:5C";
const device_ip = "::ffff:127.0.0.1";
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
});



app.use(express.json());
// app.use(authMiddleware);

app.get("/login", (req, res) => {
  try {
    const { mac } = req.query;
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    console.log(`${new Date().toISOString()}: DEVICE ${mac} FROM ${ip} REQUEST LOGIN`);

    if (mac !== device_mac) {
      return res.status(400).json({
        message: "Invalid device id",
      });
    }

    // if (ip !== device_ip) {
    //   return res.status(401).json({
    //     message: "Unsecure request",
    //     details: "Your location isn't aloewd to request a login",
    //   });
    // }

    const login = uuid4();
    io.once("connect", (connection) => {
      console.log(
        `${new Date().toISOString()}: DEVICE ${mac} FROM ${ip} CONNECTED ON (${connection.id
        })'`
      );

      setTimeout(() => {
        connection.emit("secure-timeout");
        connection.disconnect();
      }, secure_timeout);
      connection.on("disconnect", (_) => {
        console.log(
          `${new Date().toISOString()}: DEVICE ${mac} FROM ${ip} DISCONNECTED FROM (${connection.id
          })'`
        );
      });
    });

    res.status(200).send(login);
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

app.post("/open/:login", (req: Req, res) => {
  const { login } = req.params;
  const password = req.headers["password"];
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  if (password !== secure_password || !ip) {
    return res.status(401).json({
      message: "Unsecure request",
      details: "Your app version is out of date. Please update it",
    });
  }

  if (io.emit(login)) {
    console.log(`${new Date().toISOString()}: ${ip} REQUEST OPEN ON ${login}`);
    res.status(200).json({
      message: "Success!",
    });
  } else {
    res.status(500).json({
      message: "Error on send open signal!",
    });
  }
});

const server = httpServer.listen(port, () =>
  console.log(
    `${new Date().toISOString()}: Server running at http://localhost:${port}/`
  )
);
