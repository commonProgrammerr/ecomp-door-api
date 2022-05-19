import "console";
import { createServer, Server as HtppServer } from "http";
import { Server as SocketServer } from "socket.io";
const secure_timeout = Number(process.env.SECURE_TIMEOUT) || 12e4;

enum ServerConstants {
  MIN_PORT_ADRESS = 3030,
  MAX_PORT_ADRESS = 8020,
  PORTS_RANGE = Math.abs(
    ServerConstants.MIN_PORT_ADRESS - ServerConstants.MAX_PORT_ADRESS
  ),
}

export class ServerManager extends SocketServer {
  http: HtppServer;
  port: number;
  timelife: number;
  constants: ServerConstants

  constructor(_timelife = 18e5) {
    const httpServer = createServer();
    super(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      allowEIO3: true,
    });
    this.http = httpServer;
    this.port = 0;
  }

  close(fn?: (err?: Error) => void): void {
    super.close((err) => {
      if (err) {
        console.error(err);
      }
      fn?.(err);
      this.port = 0;
    });
  }

  open(port?: number) {
    this.port =
      port ||
      ServerConstants.MIN_PORT_ADRESS +
      ServerConstants.PORTS_RANGE * Math.random();
    this.http.listen(this.port, () => {
      console.log(`Socket running at :${port}`);
    });
    setTimeout(() => this.close(), this.timelife);
  }

  actions: {};

  onConnect(mac: string, ip: string) {
    return this.once("connect", (connection) => {
      console.log(`DEVICE ${mac} FROM ${ip} CONNECTED ON (${connection.id})'`);

      setTimeout(() => {
        connection.emit("secure-timeout");
        connection.disconnect();
      }, secure_timeout);
      connection.on("disconnect", (_) => {
        console.log(
          `DEVICE ${mac} FROM ${ip} DISCONNECTED FROM (${connection.id})'`
        );
      });
    });
  }

  emitOpen(login: string) {
    return this.emit(login);
  }
}
// export function openSocketServer(port: number, lifetime = 18e5) {
//   const httpServer = createServer();
//   const io = new SocketServer(httpServer, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//       credentials: true,
//     },
//     allowEIO3: true,
//   });
//   const server = httpServer.listen(port, () => {
//     console.log(`Socket running at http://localhost:${port}/`);
//   });
//   setTimeout(() => server.close(), lifetime);
//   return {
//     server,
//     login(mac: string, ip: string) {
//       return io.once("connect", (connection) => {
//         console.log(
//           `DEVICE ${mac} FROM ${ip} CONNECTED ON (${connection.id})'`
//         );

//         setTimeout(() => {
//           connection.emit("secure-timeout");
//           connection.disconnect();
//         }, secure_timeout);
//         connection.on("disconnect", (_) => {
//           console.log(
//             `DEVICE ${mac} FROM ${ip} DISCONNECTED FROM (${connection.id})'`
//           );
//         });
//       });
//     },

//     open(login: string) {
//       return io.emit(login);
//     },
//   };
// }
