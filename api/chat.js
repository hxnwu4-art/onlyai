// api/chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { message, mode } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message가 필요합니다." });
    }

    // 한글만 쓰라고 모델에 강하게 지시
    const systemPrompt =
      mode === "image"
        ? "너는 이미지 프롬프트를 만들어 주는 도우미야. 사용자의 요청을 명확한 이미지 묘사로 바꿔줘. 모든 답변은 반드시 한국어 한글(가-힣)로만 쓰고, 한자·중국어·일본어 문자는 절대 쓰지 마."
        : mode === "voice"
        ? "너는 음성 기반 대화용 한국어 AI야. 말하듯 자연스럽고 짧게 대답해줘. 모든 답변은 반드시 한국어 한글(가-힣)로만 쓰고, 한자·중국어·일본어 문자는 절대 쓰지 마."
        : "너는 한국어로만 답하는 AI야. 모든 답변을 반드시 한글(가-힣)로만 쓰고, 한자·중국어·일본어 문자는 절대 쓰지 마. 영어 단어는 꼭 필요한 경우에만 짧게 사용하고, 기본 언어는 항상 한국어 한글로 유지해.";

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error("GROQ_API_KEY가 설정되지 않았습니다.");
      return res.status(500).json({ error: "서버 설정 오류 (API 키 없음)" });
    }

    // Vercel의 Node 런타임은 fetch가 기본 내장이라 node-fetch 안 써도 됨
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 512,
          temperature: 0.4,
        }),
      }
    );

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API 에러:", errText);
      return res.status(500).json({ error: "Groq API 호출 실패" });
    }

    const data = await groqResponse.json();
    let answer =
      data.choices?.[0]?.message?.content || "AI 응답을 가져오지 못했어.";

    // 한자/일본어 등 이상한 문자 필터링 (프론트에서 한 번 더 하겠지만 백에서도 기본 정리)
    answer = answer.replace(
      /[^\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F0-9A-Za-z\s.,!?'"()~\-:;…·]/g,
      ""
    );

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("서버 내부 오류:", error);
    return res.status(500).json({ error: "서버 내부 오류" });
  }
}