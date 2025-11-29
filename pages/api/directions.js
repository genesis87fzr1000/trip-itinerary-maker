export default async function handler(req, res) {
  const { from, to } = req.query;
  if (!from || !to) {
    return res.status(400).json({ error: 'from と to を指定してください' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'API 呼び出しに失敗しました', details: err.message });
  }
}

