const express = require("express");

const router = express.Router();

router.get("/place-image", (req, res) => {
  res.json({
    imageUrl: null,
    source: null,
  });
});

router.post("/generate-itinerary", async (req, res, next) => {
  try {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({ error: "Missing DEEPSEEK_API_KEY" });
    }

    const trip = req.body;
    const totalDays = Number(trip.days || trip.totalDays || 1);
    const city = trip.city || trip.destination || "the destination";
    const country = trip.country || "";

    const systemPrompt = `
You are a travel itinerary planner.
Return only valid JSON.
No markdown.
No explanation.
No comments.
`;

    const userPrompt = `
Create a realistic travel itinerary as JSON.

Trip data:
${JSON.stringify(trip, null, 2)}

Rules:
- Create exactly ${totalDays} days.
- Each day must have exactly 2 places.
- Use real, popular places in ${city}${country ? `, ${country}` : ""}.
- Avoid repeating places.
- Keep descriptions short.
- Use morning and afternoon time blocks.
- Return JSON in this exact structure:

{
  "destination": "City, Country",
  "summary": "short summary",
  "days": [
    {
      "day": 1,
      "title": "short day title",
      "places": [
        {
          "name": "place name",
          "timeBlock": "morning",
          "startTime": "09:00",
          "endTime": "11:00",
          "description": "short description"
        },
        {
          "name": "place name",
          "timeBlock": "afternoon",
          "startTime": "14:00",
          "endTime": "16:00",
          "description": "short description"
        }
      ]
    }
  ]
}
`;

    const deepseekResponse = await fetch(
      "https://api.deepseek.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
          max_tokens: 4000,
        }),
      },
    );

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      console.error("DeepSeek error:", errorText);
      return res.status(500).json({ error: "DeepSeek request failed" });
    }

    const data = await deepseekResponse.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: "DeepSeek returned no content" });
    }

    const itinerary = JSON.parse(content);

    if (!Array.isArray(itinerary.days)) {
      return res
        .status(500)
        .json({ error: "DeepSeek returned invalid itinerary shape" });
    }

    return res.json(itinerary);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
