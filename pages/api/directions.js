// pages/api/directions.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const { waypoints } = req.body;

  if (!waypoints || waypoints.length < 2) {
    return res.status(400).json({ error: "waypoints must be >= 2" });
  }

  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  // 全区間の結果（複数候補も全て保持）
  const allSegments = [];

  try {
    // 区間ごとに Directions API を叩く
    for (let i = 0; i < waypoints.length - 1; i++) {
      const origin = encodeURIComponent(waypoints[i]);
      const destination = encodeURIComponent(waypoints[i + 1]);

      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin}` +
        `&destination=${destination}` +
        `&alternatives=true` +
        `&mode=driving` +
        `&language=ja` +
        `&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        return res.status(200).json({
          error: `区間 ${waypoints[i]} → ${waypoints[i + 1]} のルートが見つかりません`,
          routes: [],
        });
      }

      allSegments.push({
        from: waypoints[i],
        to: waypoints[i + 1],
        routes: data.routes,   // 各区間の複数候補
      });
    }

    return res.status(200).json({ segments: allSegments });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "API error", detail: e.message });
  }
}
