import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await fetch("https://api.droq.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "droq-latest",
        messages: [
          { role: "user", content: message }
        ],
      }),
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "응답없음";

    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ answer: "서버터졌음ㅅㅂ" });
  }
});

app.listen(3000, () => {
  console.log("server running on 3000");
});
