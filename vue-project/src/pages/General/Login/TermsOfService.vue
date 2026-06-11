<template>
<main class="policy-page">
<section class="policy-panel">
    <header class="policy-header">
    <p class="eyebrow">PHISH-TRAP</p>
    <h1>利用規約</h1>
    <p>
        この利用規約は、株式会社 防人人（以下「当社」といいます。）が提供する
        フィッシング対策学習サービス「PHISH-TRAP」（以下「本サービス」といいます。）の
        利用条件を定めるものです。
    </p>
    </header>

    <article class="policy-content">
    <section>
        <h2>第1条（適用）</h2>
        <p>
        本規約は、本サービスの利用に関する当社とユーザーとの一切の関係に適用されます。
        ユーザーは、本規約に同意したうえで本サービスを利用するものとします。
        </p>
    </section>

    <section>
        <h2>第2条（利用登録）</h2>
        <p>
        利用登録を希望する方は、当社の定める方法により登録を申請し、当社がこれを承認することで
        利用登録が完了します。当社は、登録情報に虚偽がある場合や過去に本規約へ違反したことがある場合、
        登録を承認しないことがあります。
        </p>
    </section>

    <section>
        <h2>第3条（アカウント管理）</h2>
        <p>
        ユーザーは、自己の責任でメールアドレスおよびパスワードを管理するものとします。
        アカウント情報の管理不十分、第三者の使用等によって生じた損害について、当社は責任を負いません。
        </p>
    </section>

    <section>
        <h2>第4条（禁止事項）</h2>
        <ul>
        <li>法令または公序良俗に違反する行為</li>
        <li>他のユーザー、第三者、または当社の権利を侵害する行為</li>
        <li>本サービスの運営を妨害する行為</li>
        <li>不正アクセス、なりすまし、またはそれらを試みる行為</li>
        <li>学習目的を超えて、本サービス内の教材や疑似メールを悪用する行為</li>
        </ul>
    </section>

    <section>
        <h2>第5条（サービス内容の変更・停止）</h2>
        <p>
        当社は、必要と判断した場合、ユーザーへ事前に通知することなく本サービスの内容を変更し、
        または提供を一時停止・終了することがあります。
        </p>
    </section>

    <section>
        <h2>第6条（免責事項）</h2>
        <p>
        当社は、本サービスによってユーザーのセキュリティ被害を完全に防止することを保証するものではありません。
        ユーザーは、本サービスの学習結果を参考にしつつ、自己の判断と責任でメールやWebサイトを確認するものとします。
        </p>
    </section>

    <section>
        <h2>第7条（利用制限および登録抹消）</h2>
        <p>
        当社は、ユーザーが本規約に違反した場合、事前の通知なく本サービスの全部または一部の利用を制限し、
        またはユーザー登録を抹消できるものとします。
        </p>
    </section>

    <section>
        <h2>第8条（知的財産権）</h2>
        <p>
        本サービスに含まれる文章、画像、教材、プログラムその他のコンテンツに関する知的財産権は、
        当社または正当な権利者に帰属します。ユーザーは、当社の許可なくこれらを複製、転載、配布できません。
        </p>
    </section>

    <section>
        <h2>第9条（規約の変更）</h2>
        <p>
        当社は、必要と判断した場合、本規約を変更できるものとします。変更後の規約は、
        本サービス上に表示された時点から効力を生じるものとします。
        </p>
    </section>

    <section>
        <h2>第10条（準拠法・管轄）</h2>
        <p>
        本規約の解釈には日本法を準拠法とします。本サービスに関して紛争が生じた場合、
        当社所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
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
.policy-footer p {
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
