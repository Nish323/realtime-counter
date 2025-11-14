// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

let counter = 0;

io.on('connection', (socket) => {
  console.log('client connected:', socket.id);

  socket.emit('counterUpdated', counter);

  socket.on('increment', () => {
    counter += 1;
    io.emit('counterUpdated', counter);
  });

  socket.on('reset', () => {
    counter = 0;
    io.emit('counterUpdated', counter);
  });

  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id);
  });
});

// React のビルド成果物を配信
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// 最後に「全部キャッチ」するフォールバック
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});


const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});
