import http from "node:http";

import { Server } from "socket.io";

const port = Number(process.env.SOCKET_STUDIO_DEMO_PORT ?? 5001);

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("Socket.IO Studio demo server");
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.emit("demo:welcome", {
    socketId: socket.id,
    message: "Connected to the Socket.IO Studio demo server",
    serverTime: Date.now(),
  });

  const interval = setInterval(() => {
    socket.emit("demo:heartbeat", {
      sentAt: Date.now(),
      socketId: socket.id,
    });
  }, 5000);

  socket.on("disconnect", () => {
    clearInterval(interval);
  });
});

server.listen(port, () => {
  console.log(`Socket.IO Studio demo server listening on http://localhost:${port}`); // eslint-disable-line no-console
});
