# vue-project

Vue 3 + Vite フロント / Express API / Supabase Cloud（Tokyo）の構成です。

> 🚀 **新しくクローンしたら、まず [セットアップ（Supabase Cloud）](#セットアップsupabase-cloud) を読んでください**。
> その下の「リファレンス」「付録」は必要になったときに見れば OK です。

## セットアップ（Supabase Cloud）

開発用 DB は **チームで共有する Supabase Cloud プロジェクト** を使います。
**各メンバーの PC に Docker や Supabase CLI を入れる必要はありません**（Node.js だけで OK）。

このプロジェクトは **全員が DB を直接触る前提**で運用しています（Studio でテーブル参照や SQL 実行）。
そのため各メンバーは Supabase アカウントを作って、管理者から招待を受け取ります。

> 📝 オフライン環境で開発したい人向けの手順は[付録: ローカル Supabase](#付録-ローカル-supabase-docker)。

---

### 👤 チームメンバー向け（招待される側、ほとんどの人はこちら）

#### ✅ TL;DR チェックリスト（5〜10 分）

```text
□ 1. Supabase アカウント作成（GitHub ログイン推奨）
□ 2. 管理者から届く招待メールで「Accept Invitation」をクリック
□ 3. Node.js v22 LTS をインストール
□ 4. git clone → cd vue-project → npm install
□ 5. .env.example を .env にコピーし、管理者から共有された 3 つの値を貼り付け
□ 6. ターミナル 2 つで: npm run server:dev / npm run dev
□ 7. http://localhost:3000/api/supabase/ping が {"ok":true,...} で成功 🎉
```

#### 1. Supabase アカウント作成 + 招待を承認

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) で **GitHub ログイン** が一番楽です
2. 管理者から「**You've been invited to join ...**」というメールが届く
3. メール内の **「Accept Invitation」** をクリック
4. Dashboard に対象プロジェクトが表示されれば OK

#### 2. Node.js をインストール

`v20.19.0` 以上、または `v22.12.0` 以上（`package.json` の `engines` に準拠）。
**新規インストールなら v22 LTS を推奨**します。

- [https://nodejs.org/ja](https://nodejs.org/ja) から **LTS 版**をインストール
- 新しいターミナルで確認:
  ```sh
  node -v
  npm -v
  ```

#### 3. リポジトリをクローン & 依存インストール

```sh
git clone <このリポジトリ>
cd vue-project
npm install
```

#### 4. `.env` を作成

`.env.example` をコピー:

```sh
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

管理者から **1Password / Slack DM / Notion 非公開ページ** などで届く 3 つの値を `.env` に貼り付け:

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=<SUPABASE_URL と同じ>
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY と同じ>
```

> ⚠️ `.env` は `.gitignore` で除外済みです。**絶対にコミットしないでください**。
> `SUPABASE_SERVICE_ROLE_KEY` は RLS をバイパスする強力なキーなので、クライアント側には渡しません（サーバーのみで使用）。

#### 5. アプリを起動

ターミナル 2 つ:

```sh
# ターミナル A: API サーバー (Express, port 3000)
npm run server:dev

# ターミナル B: フロントエンド (Vite, port 5173)
npm run dev
```

#### 6. 動作確認

- **API 疎通**: [http://localhost:3000/api/supabase/ping](http://localhost:3000/api/supabase/ping)
  → `{ "ok": true, "count": 0, "rows": [] }` が返れば成功 🎉
- **Studio で DB を見る**: [Supabase Dashboard](https://supabase.com/dashboard) → 招待されたプロジェクト → **Table Editor**
  → `profiles` テーブルが見えれば migration も反映済み

---

### 👑 管理者向け（プロジェクトを作る人、初回のみ）

#### ✅ TL;DR チェックリスト

```text
□ A. Supabase Cloud で新プロジェクト作成（Tokyo / Free）
□ B. Organization Settings → Team → メンバーを Invite
□ C. supabase/migrations/*.sql を Cloud に適用（Studio SQL Editor 推奨）
□ D. 3 つの値（URL / anon / service_role）を安全な経路でメンバーに配布
```

#### A. Supabase Cloud プロジェクトを作成

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) にログイン
2. **「New project」** をクリック:
   - Project name: `phish-trap`（例）
   - Database Password: 強いものを生成（**migration 適用で必要なので必ずメモ**）
   - Region: **`Northeast Asia (Tokyo)`**
   - Pricing Plan: **Free**
3. 起動完了（1〜2 分）後、左サイドバー **Project Settings**:
   - **General** で `Project ID`（= Project Reference）をメモ
   - **API Keys** で `anon public` と `service_role`（要 Reveal）をコピー

#### B. チームメンバーを招待

1. **Organization Settings** → **Team** → **「Invite member」**
2. メンバーのメールアドレス or GitHub アカウントを入力（複数 OK）
3. メンバーに「承認メールから Accept を押してね」と一言伝える

#### C. マイグレーションを適用

`vue-project/supabase/migrations/` の SQL を Cloud DB に適用します。**プロジェクト作成直後に 1 回**、以降は新しい migration を追加するたびに実行。

**方法 A: Studio SQL Editor で貼り付け（CLI 不要・最速）**

1. Dashboard → 対象プロジェクト → **SQL Editor** → **「New query」**
2. `vue-project/supabase/migrations/*.sql` を **ファイル名順に開いて全文コピペ → Run**
3. **Table Editor** に `profiles` テーブルが現れれば成功

**方法 B: Supabase CLI で `supabase db push`**

migration をコードで管理したいときはこちら。Supabase CLI v2.101 以上が必要（[インストール手順](#supabase-cli-のインストール任意)）。

```sh
cd vue-project
supabase login                                       # 初回のみ。ブラウザが開く
supabase link --project-ref <your-project-ref>       # 初回のみ。DB password を聞かれる
supabase db push                                     # migrations/ の SQL を Cloud に流す
```

#### D. キーをメンバーに配布

3 つの値を **安全な経路** で全員に渡します:

- `SUPABASE_URL`（例 `https://abcdefghij.supabase.co`）
- `SUPABASE_ANON_KEY`（公開キー扱いだが管理推奨）
- `SUPABASE_SERVICE_ROLE_KEY` （**特に秘密**、RLS をバイパスできる）

配布手段の推奨順:
1. **1Password / Bitwarden の共有 vault**（一番安全、取り消しも楽）
2. **Slack の DM**（**public ch には絶対貼らない**）
3. **Notion の Private ページ**（権限制御付き）

> ⚠️ もしキーを誤って GitHub・公開チャンネル・スクショなどに出してしまったら、
> Dashboard → API Keys → **Roll keys** で再発行 → 全員に再配布してください。

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
  → migration 未適用。管理者の手順 C を実施依頼
- **`Invalid API key` エラー**
  → `.env` の `SUPABASE_URL` と `SUPABASE_ANON_KEY` がペアになっているか確認。
    別プロジェクトの URL とキーを混在させていない？
- **招待メールが届かない**
  → 管理者に再送依頼。または Dashboard 右上のアカウント →「Pending invitations」を確認
- **ポート 3000 が他アプリで使用中**
  → `.env` に `API_PORT=3010` を追記し、`VITE_API_URL=http://localhost:3010` も合わせる
- **チーム共有 DB を汚したくない**
  → 各自で Free プロジェクトを別途作って、`.env` だけ差し替えれば OK

---

## リファレンス

### よく使うコマンド

| 目的 | コマンド |
|---|---|
| フロント開発サーバー（Vite, port 5173） | `npm run dev` |
| API 開発サーバー（Express, port 3000 / `API_PORT`） | `npm run server:dev` |
| プロダクションビルド | `npm run build` |
| 型チェック + ビルド（厳密） | `npm run build:strict` |
| ユニットテスト | `npm run test:unit` |
| Lint（自動修正あり） | `npm run lint` |
| フォーマット | `npm run format` |

### 開発環境の推奨（任意）

- **VS Code**: [Vue (Official) 拡張](https://marketplace.visualstudio.com/items?itemName=Vue.volar) を入れて Vetur は無効化
- **ブラウザ拡張**:
  - Chromium 系: [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) + [Custom Object Formatter を ON](http://bit.ly/object-formatters)
  - Firefox: [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/) + [Custom Object Formatter を ON](https://fxdx.dev/firefox-devtools-custom-object-formatters/)
- **TypeScript で `.vue` を型解決する**: `tsc` の代わりに `vue-tsc` を使う。エディタでは Volar が必要。
- **Vite の設定**: [Vite Configuration Reference](https://vite.dev/config/)

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
