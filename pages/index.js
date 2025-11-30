import { useState } from "react";

export default function Home() {
  const [points, setPoints] = useState(["", ""]);
  const [segments, setSegments] = useState([]);

  const addPoint = () => {
    setPoints([...points, ""]);
  };

  const updatePoint = (index, value) => {
    const next = [...points];
    next[index] = value;
    setPoints(next);
  };

  const searchSegments = async () => {
    if (points.length < 2) return;

    const segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      segs.push({ from: points[i], to: points[i + 1] });
    }

    const response = await fetch("/api/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ segments: segs }),
    });

    const data = await response.json();
    setSegments(data.segments || []);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Multi-Segment Trip Planner</h1>

      <h3>地点の追加</h3>
      {points.map((p, i) => (
        <div key={i}>
          地点 {i + 1}:{" "}
          <input
            value={p}
            onChange={(e) => updatePoint(i, e.target.value)}
            style={{ marginBottom: 8 }}
          />
        </div>
      ))}

      <button onClick={addPoint}>＋ 地点追加</button>

      <hr />

      <button onClick={searchSegments} style={{ marginTop: 15 }}>
        区間ごとに検索
      </button>

      <hr />

      <h3>検索結果</h3>
      {segments.map((seg, index) => (
        <div key={index} style={{ marginBottom: 20 }}>
          <h4>
            {seg.from} → {seg.to}
          </h4>

          {seg.error && <div>エラー: {seg.error}</div>}

          {seg.routes &&
            seg.routes.map((route, i) => (
              <div key={i} style={{ padding: 10, border: "1px solid #ccc" }}>
                <div>経路{i + 1}: {route.summary}</div>
                <div>距離: {route.distance.text}</div>
                <div>時間: {route.duration.text}</div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}
