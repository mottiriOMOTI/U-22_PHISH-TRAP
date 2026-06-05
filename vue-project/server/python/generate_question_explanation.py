import sys
import json


def generate_explanation(question_text: str):
    # 本来はここでAI APIを呼ぶ
    # まずは仮データで動作確認する

    return {
        "title": "フィッシングメールの危険性",
        "why_dangerous": f"この問題文には、利用者を偽サイトへ誘導する可能性があります。対象文: {question_text}",
        "warning_signals": [
            "差出人が不自然",
            "リンク先URLが公式と異なる",
            "急いで操作させようとしている",
        ],
        "correct_action": "メール内のリンクを押さず、公式サイトやアプリから直接確認してください。",
    }


def main():
    try:
        input_text = sys.stdin.read()
        data = json.loads(input_text)

        question_text = data.get("questionText", "")

        if not question_text:
            raise ValueError("questionText is required")

        result = generate_explanation(question_text)

        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        error = {"error": str(e)}
        print(json.dumps(error, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
