// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const axios = require('axios');

const app = express();
app.use(cors());

const SHEET_WEBHOOK_URL = process.env.SHEET_WEBHOOK_URL || null;
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

async function saveRecord() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mi = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const dateFolder = `${yyyy}-${mm}-${dd}`;
  const dateTimeStr = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;

  const first = counters.a; // 先頭カウンター
  const last = counters.b; // 最後尾カウンター
  const diff = last - first;

  // Google スプレッドシートに送信
  if (SHEET_WEBHOOK_URL) {
    const payload = {
      datetime: dateTimeStr,
      first,
      last,
      diff,
    };

    try {
      await axios.post(SHEET_WEBHOOK_URL, payload);
      console.log('record posted to Google Sheet');
    } catch (postErr) {
      console.error('failed to post to Google Sheet:', postErr.message);
    }
  } else {
    console.warn('SHEET_WEBHOOK_URL is not set; skip posting to Google Sheet');
  }
}

io.on('connection', (socket) => {
  console.log('client connected:', socket.id);

  // 接続直後に現在のカウンター状態を送信
  socket.emit('countersUpdated', counters);

  // ＋1
  socket.on('increment', (key) => {
    if (key !== 'a' && key !== 'b') return;

    counters[key] += 1;
    console.log(`counter ${key} incremented:`, counters[key]);

    // 全クライアントに2つ分まとめて送信
    io.emit('countersUpdated', counters);
  });

  // ー1
  socket.on('decrement', (key) => {
    if (key !== 'a' && key !== 'b') return;

    counters[key] -= 1;
    console.log(`counter ${key} decremented:`, counters[key]);

    // 全クライアントに2つ分まとめて送信
    io.emit('countersUpdated', counters);
  });

  // リセット
  socket.on('reset', (key) => {
    if (key !== 'a' && key !== 'b') return;

    counters[key] = 0;
    console.log(`counter ${key} reset`);

    io.emit('countersUpdated', counters);
  });

  // 記録ボタンを押したときの処理
  socket.on('record', async () => {
    try {
      await saveRecord();
      // 手動記録の結果をフロントに返す
      socket.emit('recordSaved', { success: true });
    } catch (err) {
      console.error('failed to save record (manual):', err);
      socket.emit('recordSaved', { success: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id);
  });
});

// 10秒ごとに自動記録
setInterval(() => {
  saveRecord().catch((err) => {
    console.error('failed to save record (auto):', err);
  });
}, 10 * 1000);

// React のビルド済みファイルを配信
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// SPA 用のフォールバック
app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});
