
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: [
          "http://localhost:3000",
          "https://live-board-pf6oba47c-ashutosh-singhs-projects-fbd66878.vercel.app"
        ],
        methods: ["GET", "POST"]
      }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('drawing', (data) => {
    socket.broadcast.emit('drawing', data);
  });

  socket.on('clear', () => {
    socket.broadcast.emit('clear');
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 