import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*"
  }
});

app.use(express.json());
const port = process.env.PORT || 3030;


httpServer.listen(port, () => console.log(`Server running at http://localhost:${port}/`));