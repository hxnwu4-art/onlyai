// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 정적 파일 제공 (public 폴더에 index.html 있음)
app.use(express.static("public"));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 3000;

if (!GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY가 .env에 없습니다.");
  process.exit(1);
}

// 프론트에서 호출할 AI 엔드포인트
app.post("/api/chat", async (req, res) => {
  try {
    const { message, mode } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message가 필요합니다." });
    }

    // === 여기서 "한글만 써라" 강하게 박는 부분 ===
    const systemPrompt =
      mode === "image"
        ? "너는 이미지 프롬프트를 만들어 주는 도우미, 이름은 도우밍이야. 사용자의 요청을 명확한 이미지 묘사로 바꿔줘. 모든 답변은 반드시 한국어 한글(가-힣)로만 쓰고, 한자·중국어·일본어 문자는 절대 쓰지 마."
        : mode === "voice"
        ? "너의 이름은 도우밍. 말투는 존댓말 사용, 무례하면 안돼. 너는 음성 기반 대화용 한국어 AI야. 말하듯 자연스럽고 짧게 대답해줘. 모든 답변은 반드시 한국어 한글(가-힣)로만 쓰고, 한자·중국어·일본어 문자는 절대 쓰지 마."
        : "너는 한국어로만 답하는 AI, 도우밍야. 말투는 존댓말을 사용해. 모든 답변을 반드시 한글(가-힣)로만 쓰고, 한자·중국어·일본어 문자는 절대 쓰지 마. 영어 단어는 꼭 필요한 경우에만 짧게 사용하고, 기본 언어는 항상 한국어 한글로 유지해.";

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 512,
          temperature: 0.4, // 너무 창의적으로 이상한 문자 안 쓰게 살짝 낮춤
        }),
      }
    );

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      console.error("❌ Groq API 에러:", err);
      return res.status(500).json({ error: "Groq API 호출 실패" });
    }

    const data = await groqResponse.json();
    const answer =
      data.choices?.[0]?.message?.content || "AI 응답을 가져오지 못했어.";

    res.json({ answer });
  } catch (error) {
    console.error("❌ 서버 내부 오류:", error);
    res.status(500).json({ error: "서버 내부 오류" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});