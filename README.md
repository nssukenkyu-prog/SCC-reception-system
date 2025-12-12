# 受付混雑可視化システム

完全無料（Firebase Sparkプラン）で運用可能な、LINEミニアプリ連携の受付混雑可視化システムです。

## 構成

- **apps/patient-liff**: 患者用LINEミニアプリ (Vite + React)
- **apps/staff-dashboard**: スタッフ用管理画面 (Vite + React)
- **apps/public-status**: 公開用混雑状況表示 (Vite + React)
- **packages/shared**: 共通型定義

## 前提条件

- Node.js (v18+)
- Firebase CLI
- LINE Developers アカウント (LIFF ID)

## セットアップ手順

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **環境変数の設定**
   `.env.example` をコピーして `.env` を作成し、必要な値を埋めてください。
   ```bash
   cp .env.example .env
   ```
   ※ 各アプリのディレクトリ (`apps/*/`) にも `.env` が必要な場合がありますが、Viteはルートの `.env` も読み込めます（設定次第）。今回はルートの `.env` を各アプリで読み込むか、各アプリにコピーしてください。

3. **Firebaseのセットアップ**
   ```bash
   firebase login
   firebase init
   # Firestore, Hosting, Emulators を選択
   ```

4. **開発サーバーの起動**
   ```bash
   npm run dev
   ```
   - Patient App: http://localhost:5173
   - Staff Dashboard: http://localhost:5174
   - Public Status: http://localhost:5175 (ポートは自動割り当て)

## デプロイ

```bash
npm run build
firebase deploy
```

## 運用フロー

1. **患者**: 受付のNFCタグ/QRコードからLIFFを起動 -> 「来院登録」
2. **スタッフ**: ダッシュボードで「会計済」に変更
3. **公開画面**: 自動的に待ち時間と人数が更新されます

## セキュリティ

- Firestoreセキュリティルールにより、患者データへのアクセスは厳格に制限されています。
- 公開画面は集計されたデータ (`publicStatus`) のみを読み取ります。
