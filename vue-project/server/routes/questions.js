import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
const router = Router();
// 内部的（メモリ上）に問題データをキャッシュ・割り当てるための領域
let internalQuestionsMap = {};
let isInitialized = false; // 起動時のクラッシュを防ぐための初期化フラグ
/**
 * データベース接続エラーなどの際、アプリを落とさずに稼働させるためのローカルフォールバックデータ
 * 最新のスキーマ（has_link, attachments, decoy等）を完全に反映
 */
const fallbackQuestions = [
    {
        id: 'sample-phishing-1',
        category: 'student',
        title: '【重要】学生アカウントのセキュリティ確認と緊急更新のお知らせ',
        sender_name: '大学ITサポートセンター',
        sender_email: 'security-alert@univ-support-portal.net',
        body: '学生の皆様へ\n\n最近、不審な第三者による学内ポータルサイトへの不正アクセスが複数確認されております。\n安全のため、すべての学生アカウントについてセキュリティ情報の確認とパスワードの再設定をお願いしております。\n\n以下のリンクより速やかにログインし、情報の更新を行ってください。\n24時間以内に更新が確認できない場合、一時的にアカウントが凍結される可能性があります。\n\n■ アカウント更新URL:\nhttp://univ-support-portal.net/secure/login.html\n\n※本メールは配信専用です。返信はできません。\n------------------------------------\n学内情報セキュリティ部会',
        is_phishing: true,
        phishing_type: 'link',
        has_link: true,
        dangerous_links: [
            { text: "アカウント更新URL", url: "http://univ-support-portal.net/secure/login.html" }
        ],
        has_attachment: false,
        safe_attachments: null,
        dangerous_attachments: null,
        is_decoy: false,
        question_explanations: {
            why_dangerous: 'このメールは、送信元のドメインが公式のものではありません。また、「24時間以内」などと緊急性を煽り、個人情報を詐取するフィッシングサイトへ誘導しています。',
            warning_signals: ["送信元のメールアドレスが非公式のもの", "緊急性を煽り口座や個人情報を要求する文面", "偽サイト（http://univ-support...）へのリンク"],
            correct_action: ["「メール内のリンクは絶対にクリックしない」ことが最優先です。大学の公式ホームページから直接ポータルサイトにアクセスし、お知らせやステータスを確認してください。不審な場合は学内の問い合わせ窓口に連絡しましょう。"]
        }
    },
    {
        id: 'sample-safe-2',
        category: 'general',
        title: '【定期】サービスご利用明細確定のお知らせ',
        sender_name: '株式会社クレカサポート',
        sender_email: 'statement@credit-support.co.jp',
        body: 'いつも弊社サービスをご利用いただき誠にありがとうございます。\n\n2026年6月度のご利用明細が確定いたしましたのでお知らせいたします。\n今回の請求金額およびお支払日につきましては、会員専用Webサイト「マイページ」にてご確認ください。\n\n■ ご利用明細の確認はこちらから（要ログイン）:\nhttps://www.credit-support.co.jp/mypage/\n\n※弊社では、メール本文中で直接お客様のクレジットカード番号や暗証番号、個人情報を入力いただくよう求めることは一切ございません。不審なメールにご注意ください。\n\n------------------------------------\n株式会社クレカサポート\nカスタマーサービス窓口',
        is_phishing: false,
        phishing_type: null,
        has_link: true,
        dangerous_links: null, // 安全なメールのため危険なリンクはなし
        has_attachment: false,
        safe_attachments: null,
        dangerous_attachments: null,
        is_decoy: false,
        question_explanations: {
            why_dangerous: 'このメールは安全な定期案内通知です。クレジットカード番号などの個人情報をメール本文中で直接求めておらず、セキュリティに対する注意喚起も記載されています。送信ドメイン（@credit-support.co.jp）も公式のURLと一致しています。',
            warning_signals: ["公式の暗号化されたドメイン（https）を使用している", "重要な個人情報の入力をメール内で求めていない", "不審なURLではなく公式マイページへの正しいログイン導線が用意されている"],
            correct_action: ["ブックマークしている公式ページや、公式アプリを経由して明細を確認するのが最も安全な行動です。"]
        }
    }
];
/**
 * フォールバック（ダミーデータ）を内部メモリに強制割り当てする関数
 */
function loadFallbackToInternalMemory() {
    console.log('💡 ローカルのフォールバックデータを内部メモリに適用します...');
    const tempMap = {};
    fallbackQuestions.forEach((q, index) => {
        const stringId = String(q.id);
        tempMap[stringId] = q;
        tempMap[index + 1] = q; // インデックスベース（1, 2）でも問題に直接アクセスできるようにマッピング
    });
    internalQuestionsMap = tempMap;
    console.log(`✅ ローカルデータを内部に割り当てました（計 ${fallbackQuestions.length} 件）`);
}
/**
 * バックエンド内部でSupabaseからデータを先読みし、連想配列に「内部的」に割り当てる関数
 * questions と question_explanations の両方のテーブルから全データを取得し、スキーマ定義に合わせて堅牢に結合します
 */
async function loadQuestionsToInternalMemory() {
    try {
        console.log('🔄 Supabaseから問題データ（questions）を読み込んでいます...');
        if (!supabaseAdmin) {
            throw new Error('supabaseAdmin が正しく初期化されていません。');
        }
        // 1. questions テーブルから有効かつ演出用ではないデータを取得
        let { data: qData, error: qError } = await supabaseAdmin
            .from('questions')
            .select('*')
            .eq('is_active', true)
            .eq('is_decoy', false); // 演出用メール（is_decoy: true）は問題一覧から除外
        if (qError) {
            throw new Error(`Supabase Questions Query Error: ${qError.message}`);
        }
        // セーフヒーリング（自己修復）ロジック
        // is_active/is_decoy の絞り込みでデータが取れなかった場合、条件を外して全問題レコードの取得を試みる
        if (!qData || qData.length === 0) {
            console.warn('⚠️ 条件に合うアクティブな問題が取得できなかったため、フィルターを外して全問題レコードの取得を試みます...');
            const { data: allQuestions, error: allQuestionsError } = await supabaseAdmin
                .from('questions')
                .select('*');
            if (allQuestionsError) {
                console.error(`❌ 全データ取得のリカバリクエリも失敗しました: ${allQuestionsError.message}`);
            }
            else if (allQuestions && allQuestions.length > 0) {
                console.log(`ℹ️ [診断成功] フィルターなしで ${allQuestions.length} 件の問題レコードを検出しました。これらを使用します。`);
                qData = allQuestions;
            }
            else {
                console.warn('⚠️ [警告] データベースの「questions」テーブル自体が完全に空、またはRLS（行レベルセキュリティ）制限によりレコードが1件も見えません。');
                console.warn('👉 【確認方法1】Supabaseの「questions」テーブルにデータが入っていることをもう一度確認してください。');
                console.warn('👉 【確認方法2】「server/lib/supabase.ts」の "serviceRoleKey" に、誤って "anon public" キーを貼り付けていないか確認してください。');
                console.warn('   ※ anonキーを使用している場合、RLSポリシーが設定されていないとデータが取得できず、空の配列 [] が返ってきます。');
                console.warn('👉 【確認方法3】Supabaseの Table Editor で "questions" テーブルの「RLS (Row Level Security)」を一時的に「Disable RLS（無効化）」に設定してみてください。');
            }
        }
        // 2. question_explanations テーブルから解説データをすべて取得
        console.log('🔄 Supabaseから解説データ（question_explanations）を読み込んでいます...');
        const { data: eData, error: eError } = await supabaseAdmin
            .from('question_explanations')
            .select('*');
        if (eError) {
            console.warn(`⚠️ 解説データの取得に失敗しました（スキップします）: ${eError.message}`);
        }
        // 取得した解説データを question_id をキーにしたマップに整理
        const explanationMap = {};
        if (eData && eData.length > 0) {
            eData.forEach((exp) => {
                if (exp && exp.question_id) {
                    explanationMap[exp.question_id] = exp;
                }
            });
        }
        if (qData && qData.length > 0) {
            const tempMap = {};
            qData.forEach((q, index) => {
                if (!q)
                    return;
                // 💡 JSON型カラムの安全なパース
                const parseJsonField = (fieldValue) => {
                    if (typeof fieldValue === 'string') {
                        try {
                            return JSON.parse(fieldValue);
                        }
                        catch (e) {
                            return null;
                        }
                    }
                    return fieldValue;
                };
                q.dangerous_links = parseJsonField(q.dangerous_links);
                q.safe_attachments = parseJsonField(q.safe_attachments);
                q.dangerous_attachments = parseJsonField(q.dangerous_attachments);
                // メモリ上で questions の id と question_explanations の question_id を紐付け
                const expRaw = explanationMap[q.id];
                if (expRaw) {
                    // フロントエンド（Explanation.vue）の型定義に合わせるための整形処理
                    let parsedWarningSignals = [];
                    let parsedCorrectAction = [];
                    // warning_signals のパース（JSON文字列化された配列を安全に元に戻す）
                    try {
                        if (typeof expRaw.warning_signals === 'string') {
                            parsedWarningSignals = JSON.parse(expRaw.warning_signals);
                        }
                        else if (Array.isArray(expRaw.warning_signals)) {
                            parsedWarningSignals = expRaw.warning_signals;
                        }
                    }
                    catch (e) {
                        parsedWarningSignals = expRaw.warning_signals ? [expRaw.warning_signals] : [];
                    }
                    // correct_action のパース（TEXT型をフロントエンドで使いやすいように配列化する）
                    try {
                        if (typeof expRaw.correct_action === 'string') {
                            if (expRaw.correct_action.startsWith('[')) {
                                parsedCorrectAction = JSON.parse(expRaw.correct_action);
                            }
                            else {
                                parsedCorrectAction = [expRaw.correct_action];
                            }
                        }
                        else if (Array.isArray(expRaw.correct_action)) {
                            parsedCorrectAction = expRaw.correct_action;
                        }
                    }
                    catch (e) {
                        parsedCorrectAction = expRaw.correct_action ? [expRaw.correct_action] : [];
                    }
                    q.question_explanations = {
                        why_dangerous: expRaw.why_dangerous || '解説データはありません。',
                        warning_signals: parsedWarningSignals,
                        correct_action: parsedCorrectAction
                    };
                }
                else {
                    // 解説がDBに紐づいていない場合の安全なデフォルト表示
                    q.question_explanations = {
                        why_dangerous: 'この問題の解説テキストは現在データベースに未登録です。',
                        warning_signals: ["不審な点を確認してください"],
                        correct_action: ["公式窓口などから直接確認を行ってください。"]
                    };
                }
                const stringId = String(q.id);
                tempMap[stringId] = q;
                tempMap[index + 1] = q; // ID: 1, 2... としてもアクセスできるように格納
            });
            internalQuestionsMap = tempMap;
            console.log(`✅ Supabaseから問題＆解説データをマージして割り当てました（計 ${qData.length} 件）`);
        }
        else {
            console.warn('⚠️ Supabaseから有効なデータが1件も取得できませんでした。フォールバックデータを使用します。');
            loadFallbackToInternalMemory();
        }
    }
    catch (err) {
        console.error('❌ Supabaseからのデータ読み込み・マージ処理に失敗したため、ローカルデータに切り替えます。詳細:', err.message);
        loadFallbackToInternalMemory();
    }
}
/**
 * 初回リクエスト時に一度だけデータを初期化する関数
 */
async function ensureInitialized() {
    if (!isInitialized) {
        await loadQuestionsToInternalMemory();
        isInitialized = true;
    }
}
/**
 * [APIルート1] GET /api/questions
 */
router.get('/', async (_req, res) => {
    console.log('====== 📥 GET /api/questions にリクエストが到達しました ======');
    try {
        await ensureInitialized();
        let allValues = Object.values(internalQuestionsMap);
        const uniqueQuestions = allValues.filter((value, index, self) => value && self.findIndex((v) => v && v.id === value.id) === index);
        const firstQuestion = uniqueQuestions[0];
        if (!firstQuestion) {
            console.log('🚨 キャッシュが未だに空のため、強制的にフォールバックデータ1件目を返却します');
            return res.status(200).json(fallbackQuestions[0]);
        }
        return res.status(200).json(firstQuestion);
    }
    catch (error) {
        console.error('❌ GET /api/questions でエラーが発生しました。最終セーフティネットを発動します:', error);
        return res.status(200).json(fallbackQuestions[0]);
    }
});
/**
 * [APIルート2] GET /api/questions/:id
 */
router.get('/:id', async (req, res) => {
    const targetId = String(req.params.id);
    console.log(`====== 📥 GET /api/questions/${targetId} にリクエストが到達しました ======`);
    try {
        await ensureInitialized();
        let matchedQuestion = internalQuestionsMap[targetId];
        if (!matchedQuestion) {
            const allValues = Object.values(internalQuestionsMap);
            matchedQuestion = allValues.find((q) => q && String(q.id) === targetId);
        }
        if (!matchedQuestion) {
            console.warn(`⚠️ ID ${targetId} に合致する問題がなかったため、フォールバックの対応データを返します。`);
            const fallbackIdx = parseInt(targetId, 10) - 1;
            const defaultData = fallbackQuestions[fallbackIdx] || fallbackQuestions[0];
            return res.status(200).json(defaultData);
        }
        return res.status(200).json(matchedQuestion);
    }
    catch (error) {
        console.error(`❌ GET /api/questions/${req.params.id} で内部エラーが発生しました。デフォルトデータを強制的に返します:`, error);
        return res.status(200).json(fallbackQuestions[0]);
    }
});
export default router;
