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

// A / B の2つのカウンター
let counters = {
  a: 0,
  b: 0,
};

io.on('connection', (socket) => {
  console.log('client connected:', socket.id);

  // 接続直後に現在のカウンター状態を送信
  socket.emit('countersUpdated', counters);

  // どっちのカウンターを増やすか key ('a' | 'b') で受け取る
  socket.on('increment', (key) => {
    if (key !== 'a' && key !== 'b') return;

    counters[key] += 1;
    console.log(`counter ${key} incremented:`, counters[key]);

    // 全クライアントに2つ分まとめて送信
    io.emit('countersUpdated', counters);
  });

  // リセットも同様に key 指定で
  socket.on('reset', (key) => {
    if (key !== 'a' && key !== 'b') return;

    counters[key] = 0;
    console.log(`counter ${key} reset`);

    io.emit('countersUpdated', counters);
  });

  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id);
  });
});

// React のビルド成果物を配信
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// フォールバック：どのパスでも index.html を返す
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});
