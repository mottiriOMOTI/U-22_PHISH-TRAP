<template>
<main class="policy-page">
<section class="policy-panel">
    <header class="policy-header">
    <p class="eyebrow">PHISH-TRAP</p>
    <h1>プライバシーポリシー</h1>
    <p>
        株式会社 防人人（以下「当社」といいます。）は、当社が提供するフィッシング対策学習サービス
        「PHISH-TRAP」（以下「本サービス」といいます。）におけるユーザーの個人情報の取扱いについて、
        以下のとおりプライバシーポリシーを定めます。
    </p>
    </header>

    <article class="policy-content">
    <section>
        <h2>第1条（個人情報）</h2>
        <p>
        個人情報とは、氏名、メールアドレス、その他特定の個人を識別できる情報、
        または他の情報と照合することで特定の個人を識別できる情報をいいます。
        </p>
    </section>

    <section>
        <h2>第2条（取得する情報）</h2>
        <p>
        当社は、本サービスの利用登録、ログイン、学習状況の記録、お問い合わせ対応に必要な範囲で、
        氏名またはニックネーム、メールアドレス、パスワード、学習履歴、利用日時などの情報を取得することがあります。
        </p>
    </section>

    <section>
        <h2>第3条（利用目的）</h2>
        <ul>
        <li>本サービスの提供、運営、本人確認のため</li>
        <li>アカウント登録、ログイン、学習状況の管理のため</li>
        <li>お問い合わせへの回答や重要なお知らせの連絡のため</li>
        <li>サービス改善、不具合調査、利用状況分析のため</li>
        <li>不正利用、規約違反、セキュリティ上の問題を防止するため</li>
        </ul>
    </section>

    <section>
        <h2>第4条（利用目的の変更）</h2>
        <p>
        当社は、変更前の利用目的と関連性を有すると合理的に認められる範囲で、個人情報の利用目的を変更することがあります。
        変更した場合は、本サービス上での表示など適切な方法によりユーザーへ通知または公表します。
        </p>
    </section>

    <section>
        <h2>第5条（第三者提供）</h2>
        <p>
        当社は、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者へ提供しません。
        ただし、本サービスの運営に必要な範囲で業務委託先へ個人情報の取扱いを委託することがあります。
        </p>
    </section>

    <section>
        <h2>第6条（安全管理）</h2>
        <p>
        当社は、個人情報の漏えい、滅失、毀損、不正アクセスを防止するため、必要かつ適切な安全管理措置を講じます。
        また、個人情報を取り扱う関係者に対して必要な監督を行います。
        </p>
    </section>

    <section>
        <h2>第7条（開示・訂正・削除）</h2>
        <p>
        ユーザーは、当社が保有する自己の個人情報について、開示、訂正、追加、削除、利用停止を求めることができます。
        当社は、本人確認のうえ、法令に従って速やかに対応します。
        </p>
    </section>

    <section>
        <h2>第8条（Cookie等の利用）</h2>
        <p>
        当社は、利便性の向上や利用状況の把握のため、Cookieまたはこれに類する技術を利用することがあります。
        ユーザーはブラウザの設定によりCookieの利用を制限できますが、一部機能が利用できない場合があります。
        </p>
    </section>

    <section>
        <h2>第9条（ポリシーの変更）</h2>
        <p>
        当社は、必要に応じて本ポリシーを変更することがあります。変更後の内容は、
        本サービス上に表示された時点から効力を生じるものとします。
        </p>
    </section>

    <section>
        <h2>第10条（お問い合わせ窓口）</h2>
        <p>
        本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。
        </p>
        <address>
        住所：福島県郡山市方八町2丁目4-15<br />
        社名：株式会社 防人人<br />
        代表取締役：石川 璃空<br />
        担当部署：専務<br />
        Eメールアドレス：zeal23418168@fsgcl.jp
        </address>
    </section>
    </article>

    <footer class="policy-footer">
    <p>制定日：2026年6月9日</p>
    <router-link class="return-link" to="/makeaccount">新規登録画面へ戻る</router-link>
    </footer>
</section>
</main>
</template>

<style lang="css" scoped>
.policy-page {
min-height: 100vh;
padding: 40px 16px;
background: #f5f7fb;
color: #20242a;
}

.policy-panel {
max-width: 920px;
margin: 0 auto;
padding: 32px;
border: 1px solid #d8dde6;
border-radius: 8px;
background: #ffffff;
box-shadow: 0 8px 24px rgba(31, 42, 68, 0.08);
}

.policy-header {
padding-bottom: 24px;
border-bottom: 1px solid #e4e8ef;
}

.eyebrow {
margin: 0 0 8px;
color: #4263eb;
font-size: 13px;
font-weight: 700;
}

h1 {
margin: 0 0 16px;
font-size: 32px;
line-height: 1.25;
}

.policy-header p,
.policy-content p,
.policy-content li,
.policy-footer p,
address {
line-height: 1.8;
}

.policy-content section {
padding: 22px 0;
border-bottom: 1px solid #eef1f5;
}

.policy-content section:last-child {
border-bottom: 0;
}

h2 {
margin: 0 0 10px;
font-size: 20px;
}

ul {
margin: 0;
padding-left: 22px;
}

address {
font-style: normal;
}

.policy-footer {
display: flex;
flex-wrap: wrap;
align-items: center;
justify-content: space-between;
gap: 16px;
padding-top: 24px;
}

.return-link {
display: inline-flex;
align-items: center;
justify-content: center;
min-height: 42px;
padding: 0 18px;
border-radius: 6px;
background: #4263eb;
color: #ffffff;
font-weight: 700;
text-decoration: none;
}

.return-link:hover {
background: #2f4fd0;
}

@media (max-width: 640px) {
.policy-page {
padding: 20px 12px;
}

.policy-panel {
padding: 22px 18px;
}

h1 {
font-size: 26px;
}
}
</style>
