// pages/api/directions.js
export default async function handler(req, res) {
  try {
    const { waypoints } = req.body;

    if (!waypoints || waypoints.length < 2) {
      return res.status(400).json({ error: "Waypoints が不足しています" });
    }

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const viaPoints = waypoints.slice(1, waypoints.length - 1);

    const params = new URLSearchParams({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      origin,
      destination,
    });

    if (viaPoints.length > 0) {
      params.append("waypoints", viaPoints.join("|"));
    }

    params.append("alternatives", "true");

    const url = `https://maps.googleapis.com/maps/api/directions/json?${params}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return res.status(200).json({ routes: [] });
    }

    // フロントでそのまま directions.routes を使えるように整形
    return res.status(200).json({
      routes: data.routes,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
}
