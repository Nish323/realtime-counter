FROM node:20-alpine

WORKDIR /app

# ソースを全部コピー
COPY server ./server
COPY client ./client

# サーバー依存関係インストール
WORKDIR /app/server
RUN npm install

# クライアント依存関係インストール＆ビルド
WORKDIR /app/client
RUN npm install && npm run build

# サーバー起動
WORKDIR /app/server
ENV PORT=4000
EXPOSE 4000

CMD ["npm", "start"]
