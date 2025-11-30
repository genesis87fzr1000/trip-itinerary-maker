// pages/api/segments.js
export default async function handler(req, res) {
  try {
    const { segments } = req.body;

    if (!segments || !Array.isArray(segments)) {
      return res.status(400).json({ error: "segments[] が必要です" });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GOOGLE_MAPS_API_KEY が未設定" });
    }

    const results = [];

    for (const seg of segments) {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
        seg.from
      )}&destination=${encodeURIComponent(
        seg.to
      )}&alternatives=true&language=ja&mode=driving&key=${apiKey}`;

      const response = await fetch(url);
      const json = await response.json();

      if (json.status !== "OK") {
        results.push({ from: seg.from, to: seg.to, error: json.status });
      } else {
        results.push({
          from: seg.from,
          to: seg.to,
          routes: json.routes.map((r) => ({
            summary: r.summary,
            distance: r.legs[0].distance,
            duration: r.legs[0].duration,
            overview_polyline: r.overview_polyline.points,
          })),
        });
      }
    }

    res.status(200).json({ segments: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
