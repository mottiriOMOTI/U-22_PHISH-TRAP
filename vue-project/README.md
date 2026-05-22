# vue-project

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

---

## Database セットアップ（Supabase Cloud）

開発用 DB は **チームで共有する Supabase Cloud プロジェクト** を使います。
**各メンバーの PC に Docker や Supabase CLI を入れる必要はありません**（Node.js だけで OK）。

> 📝 ローカル Docker で動かしたい人向けの手順は[付録: ローカル Supabase](#付録-ローカル-supabase-docker) を参照してください。
> 通常はチーム共有 Cloud で十分です。

### 1. 前提ツール: Node.js のみ

`v20.19.0` 以上、または `v22.12.0` 以上（`package.json` の `engines` に準拠）。
**新規インストールなら v22 LTS を推奨**します。

- [https://nodejs.org/ja](https://nodejs.org/ja) から **LTS 版**をインストール
- 新しいターミナルで確認:
  ```sh
  node -v
  npm -v
  ```

### 2. リポジトリをクローン & 依存インストール

```sh
git clone <このリポジトリ>
cd vue-project
npm install
```

### 3. Supabase Cloud の認証情報を取得

#### 共有プロジェクトの管理者（プロジェクトを作る人）が 1 回だけやること

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) にログイン（GitHub アカウント可）
2. **「New project」** をクリック
   - Project name: `phish-trap`（例）
   - Database Password: 強いものを生成（後で migration 適用に使うのでメモ）
   - Region: **`Northeast Asia (Tokyo)`** 推奨
   - Pricing Plan: **Free**
3. プロジェクト起動完了（1〜2 分）後、左サイドバー **Project Settings → API** を開く
4. 以下の値をチームメンバーに共有（**1Password / Slack DM / Notion 非公開ページ**などで）:
   - **Project URL**（例 `https://abcdefghij.supabase.co`）
   - **Project API Keys → anon public**
   - **Project API Keys → service_role**（要トグル表示。**秘密扱い**）

#### 既にプロジェクトがあるチームメンバー

管理者から共有された 3 つの値（URL / anon / service_role）を受け取るだけで OK です。

### 4. 環境変数ファイル `.env` を作成

`.env.example` をコピーして `.env` を作成:

```sh
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

`.env` を開いて、手順 3 で取得した値で書き換えます:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

> ⚠️ `.env` は `.gitignore` で除外済みです。**絶対にコミットしないでください**。
> 特に `SUPABASE_SERVICE_ROLE_KEY` はクライアント側に渡してはいけません（サーバーのみで使用）。

### 5. マイグレーションを適用（プロジェクト作成直後・1 回のみ）

> このステップは **共有プロジェクトの管理者が 1 回やれば全員に反映**されます。チームメンバー個別の作業は不要です。

`supabase/migrations/` 配下の SQL を Cloud DB に適用します。方法は 2 つ:

#### 方法 A: Studio の SQL Editor に貼り付け（CLI 不要・最速）

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) → 対象プロジェクト
2. 左サイドバー **SQL Editor** → 「New query」
3. `vue-project/supabase/migrations/` 配下の `.sql` を**ファイル名順に開いて全文コピペ → Run**
4. 完了すると `profiles` テーブル、RLS ポリシー、新規ユーザー作成トリガーが反映される

#### 方法 B: Supabase CLI で `supabase db push`（migration をコードで管理したいとき）

事前に Supabase CLI v2.101 以上をインストール（後述の[CLI インストール](#supabase-cli-のインストール任意)参照）。

```sh
# vue-project 直下で
supabase login                                       # 初回のみ。ブラウザが開く
supabase link --project-ref <your-project-ref>       # 初回のみ。DB password を聞かれる
supabase db push                                     # migrations/ の SQL を Cloud に流す
```

> 📝 以降は新しい migration を追加するたびに `supabase db push` を実行すれば反映されます。

### 6. アプリを起動

ターミナルを 2 つ開いて、それぞれで:

```sh
# ターミナル A: API サーバー (Express, port 3000)
npm run server:dev

# ターミナル B: フロントエンド (Vite, port 5173)
npm run dev
```

### 7. 動作確認

- **Studio (Cloud)**: [https://supabase.com/dashboard](https://supabase.com/dashboard) → 対象プロジェクト → Table Editor
  → `profiles` テーブルが見えれば migration 反映成功
- **API 経由の疎通確認**: [http://localhost:3000/api/supabase/ping](http://localhost:3000/api/supabase/ping)
  → `{ "ok": true, "count": 0, "rows": [] }` が返れば Express → Supabase 接続成功

---

### Supabase CLI のインストール（任意）

migration を `supabase db push` で管理する人だけ必要です。**v2.101 以上** を入れてください
（古い 2.59 系は Docker Desktop 29 と組み合わせると `Starting database...` でハングする既知の不具合あり）。

- **macOS / Linux**: `brew install supabase/tap/supabase`
- **Windows**:
  1. [GitHub releases](https://github.com/supabase/cli/releases/latest) から
     `supabase_<version>_windows_amd64.zip` をダウンロード
  2. 展開して、**`supabase.exe` と `supabase-go.exe` の両方** を同じディレクトリに置く
     （v2.101 以降は shim + Go バイナリの 2 ファイル構成）
  3. そのディレクトリを `Path` 環境変数に追加
- 確認: `supabase --version` → `2.101.0` 以上

> ⚠️ `npm install -g supabase` は公式非推奨です。

### トラブルシュート

- **`npm run server:dev` で `SUPABASE_URL が未設定です` エラー**
  → `.env` を作成し忘れ。手順 4 を再確認
- **`/api/supabase/ping` で `relation "profiles" does not exist`**
  → migration 未適用。手順 5 を実施（管理者に依頼）
- **`Invalid API key` エラー**
  → `.env` の `SUPABASE_URL` と `SUPABASE_ANON_KEY` がペアになっているか確認。
    別プロジェクトの URL とキーを混在させていない？
- **ポート 3000 が他アプリで使用中**
  → `.env` に `API_PORT=3010` を追記し、`VITE_API_URL=http://localhost:3010` も合わせる
- **チーム共有 DB を汚したくない**
  → 各自で Free プロジェクトを別途作って、`.env` だけ差し替えれば OK

---

## 付録: ローカル Supabase (Docker)

オフライン環境で開発したい、Cloud の Free 枠を消費したくない、などのケース向け。
**チーム標準ではないので、必要な人だけ参照してください**。

### 前提

- **Docker Desktop**（[Windows](https://www.docker.com/products/docker-desktop/) / [Mac](https://www.docker.com/products/docker-desktop/)）
  - インストール後 PC 再起動 → Engine running を確認
  - Settings → Resources → Memory を **4GB 以上**（推奨 8GB）
  - 確認: `docker --version` / `docker run --rm hello-world`
- **Supabase CLI v2.101 以上**（上記参照）
- **C ドライブ空き 20GB 以上**

### 起動手順

```sh
cd vue-project
supabase start                  # 初回は Docker イメージ DL で 10〜15 分
supabase status                 # URL / anon key / service_role key を表示
```

`.env` をローカル用に上書き:

```env
SUPABASE_URL=http://127.0.0.1:55401
SUPABASE_ANON_KEY=<status の anon key>
SUPABASE_SERVICE_ROLE_KEY=<status の service_role key>
VITE_SUPABASE_URL=http://127.0.0.1:55401
VITE_SUPABASE_ANON_KEY=<status の anon key>
```

ローカル DB に migration 適用:

```sh
supabase db reset     # DB 初期化 + migrations/*.sql を全部適用
```

ローカル Studio: [http://127.0.0.1:55403](http://127.0.0.1:55403)
ローカル Inbucket（メール確認）: [http://127.0.0.1:55404](http://127.0.0.1:55404)

> 📝 このプロジェクトの `supabase/config.toml` はポートを **55401〜55409** に設定済みです
> （他の Supabase プロジェクトとの衝突回避）。

### ローカル特有のトラブル

- **`Starting database...` で固まる**
  → CLI が 2.59 系。`supabase --version` で確認し、2.101 以上に更新。
- **他の Supabase プロジェクトと競合**
  → `supabase stop --all` で全停止してから再試行
- **Memory 不足**
  → Docker Desktop Settings → Resources → Memory を 8GB に
