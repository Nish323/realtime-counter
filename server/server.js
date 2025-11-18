// server/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

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
  // data/(日付)/count.txt に「日時 先頭 最後尾 差分」を1行追記する
  socket.on('record', async () => {
    try {
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

      // data/(日付)/count.txt のパス
      const dirPath = path.join(__dirname, '..', 'data', dateFolder);
      const filePath = path.join(dirPath, 'count.txt');

      // ディレクトリがなければ作成
      await fs.promises.mkdir(dirPath, { recursive: true });

      // 1行分のテキスト: 「日時 先頭 最後尾 差分」
      const line = `${dateTimeStr} ${first} ${last} ${diff}\n`;

      // 追記（ファイルが無ければ作成される）
      await fs.promises.appendFile(filePath, line, 'utf8');

      console.log('record saved:', line.trim());

      // クライアントに成功通知（任意）
      socket.emit('recordSaved', { success: true });
    } catch (err) {
      console.error('failed to save record:', err);
      socket.emit('recordSaved', { success: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('client disconnected:', socket.id);
  });
});

// GET /api/download/20251118 → data/2025-11-18/count.txt
app.get('/api/download/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // YYYYMMDD の簡易バリデーション
    if (!/^\d{8}$/.test(date)) {
      return res.status(400).send('invalid date format (use YYYYMMDD)');
    }

    const yyyy = date.slice(0, 4);
    const mm = date.slice(4, 6);
    const dd = date.slice(6, 8);
    const folderName = `${yyyy}-${mm}-${dd}`;

    const dirPath = path.join(__dirname, '..', 'data', folderName);
    const filePath = path.join(dirPath, 'count.txt');

    // ファイルが存在するかチェック
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      return res.status(404).send('count.txt not found for this date');
    }

    // ダウンロード用ヘッダ
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${folderName}-count.txt"`
    );

    const content = await fs.promises.readFile(filePath, 'utf8');
    res.send(content);
  } catch (err) {
    console.error('download by date error:', err);
    if (!res.headersSent) {
      res.status(500).send('download error');
    }
  }
});

app.get('/api/download', async (req, res) => {
  try {
    const dataDir = path.join(__dirname, '..', 'data');

    // dataフォルダが存在するかチェック
    try {
      await fs.promises.access(dataDir, fs.constants.R_OK);
    } catch {
      return res.status(404).send('data directory not found');
    }

    // レスポンスヘッダを設定
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="counter-data.zip"'
    );

    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.on('error', (err) => {
      console.error('archive error:', err);
      if (!res.headersSent) {
        res.status(500).send('archive error');
      }
    });

    // zip をレスポンスにストリーム
    archive.pipe(res);

    // dataディレクトリ全体をzipに追加（ルート直下に展開）
    archive.directory(dataDir, false);

    // 圧縮開始
    archive.finalize();
  } catch (err) {
    console.error('download error:', err);
    if (!res.headersSent) {
      res.status(500).send('download error');
    }
  }
});

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
