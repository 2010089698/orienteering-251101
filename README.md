# Orienteering プロジェクト開発ガイド

本リポジトリは CQRS と DDD（ドメイン駆動設計）を基盤としたイベント管理システムです。ポート&アダプターアーキテクチャを採用し、関心の分離・高凝集・疎結合を維持しながらフロントエンド（React + Vite）とバックエンド（Express + TypeORM）を統合します。本ドキュメントでは開発環境の準備、アプリケーション起動、データベース初期化、テスト実行の流れを説明します。

## 1. 環境準備

1. Node.js (v18 以上) と npm をインストールします。
2. 依存関係をインストールします。
   ```bash
   npm install
   ```
3. 環境変数テンプレートをコピーし、開発用の設定を整えます。
   ```bash
   cp backend/.env.development.example backend/.env.development
   cp frontend/.env.development.example frontend/.env.development
   ```
   - バックエンド用テンプレート: [backend/.env.development.example](backend/.env.development.example)
   - フロントエンド用テンプレート: [frontend/.env.development.example](frontend/.env.development.example)

必要に応じてポート番号やデータベースファイルのパスを編集し、各レイヤが疎結合なまま協調できるよう設定してください。

## 2. 開発サーバーの起動

ホットリロード対応でバックエンドとフロントエンドを同時起動できます。

- バックエンドのみ: `npm run dev:backend`
- フロントエンドのみ: `npm run dev:frontend`
- 両方同時（推奨）: `npm run dev`

`npm run dev` は `concurrently` で 2 つのサーバーを監視起動します。`backend/src/server.ts` と `frontend/vite.config.ts` をエントリポイントとして参照し、それぞれ `.env.development` から環境変数を読み込みます。

### ヘルスチェック

バックエンド起動後、`GET http://localhost:3000/health` にアクセスしてヘルスチェックを行い、アプリケーション層が正しく依存関係を解決しているか確認してください。

## 3. データベース初期化とテスト

1. **データベース初期化**
   - `backend/.env.development` の `RESET_DB=true` を設定してバックエンドを再起動すると、SQLite データベースが再作成されます。
   - 初期化後は `RESET_DB=false` に戻し、意図しない再初期化を防ぎます。

2. **テスト実行**
   - ドメイン層とアプリケーション層の振る舞いを保証するために以下を実行します。
     ```bash
     npm test
     ```
   - テストでは CQRS のコマンド／クエリ・ハンドラーが期待通りにドメインオブジェクトを操作できるか検証します。

## 4. ビルド

本番配備向けアーティファクトを生成する場合は以下を実行します。

- バックエンド: `npm run build:backend`
- フロントエンド: `npm run build:frontend`
- 全体: `npm run build`

## 5. レイヤ構成と関心の分離

バックエンドは以下の 4 層で構成され、CQRS とポート&アダプターに基づき責務を分離します。

```
[Presentation]  Express ルーター / HTTP コントローラ
      ↓
[Application]   UseCase / Command Handler / Query Handler
      ↓
[Domain]        Aggregate / Entity / Value Object / Domain Service
      ↓
[Infrastructure]TypeORM Repository / SQLite Adapter / 外部サービス
```

フロントエンドは UI コンポーネント層とアプリケーションサービス層を明確に切り分け、API クライアントを介してバックエンドのクエリを実行します。これにより疎結合なやり取りと高凝集なユースケースの実装を両立させています。

## 6. トラブルシューティング

- ポート競合が発生した場合は、各 `.env.development` ファイルで `FRONTEND_PORT` または `BACKEND_PORT` を変更してください。
- `GET /health` が失敗する場合は、バックエンドの依存パッケージが最新か (`npm install`) と SQLite ファイルのパーミッションを確認してください。

開発に際しては DDD のユビキタス言語を尊重し、各レイヤ間の契約を明示した上で小さな単位で変更を積み重ねてください。
