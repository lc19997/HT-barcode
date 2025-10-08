# バックエンド導入手順（Node.js + Oracle DB）

このプロジェクトのバックエンドは Node.js を使用し、Oracle Database と接続して動作します。以下の手順に従って、クライアントサーバー上でセットアップしてください。

## 必要環境

- npm **v10.9.3以上**
- Node.js **v22.19.0 以上** 
- Oracle Database（接続先が有効であること）  

## セットアップ手順

```bash
# 1. プロジェクトディレクトリへ移動
cd shipping-ht-backend

# 2. 依存パッケージをインストール
npm install

# 3. 環境変数または設定ファイルを確認
# 例: .env ファイルに以下のような情報を記載
# ORACLE_USER=your_username
# ORACLE_PASSWORD=your_password
# ORACLE_CONNECTION_STRING=your_host:1521/your_service_name
# PORT=3000

# 4. サーバー起動
node app.js
