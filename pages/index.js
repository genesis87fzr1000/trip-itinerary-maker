import { useState, useEffect } from "react";

export default function Home() {
  const [map, setMap] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [points, setPoints] = useState([]);
  const [result, setResult] = useState(null);

  // Google Maps 初期化
  useEffect(() => {
    if (!window.google) return;

    const newMap = new window.google.maps.Map(
      document.getElementById("map"),
      {
        center: { lat: 35.6895, lng: 139.6917 },
        zoom: 10
      }
    );

    const renderer = new window.google.maps.DirectionsRenderer({
      map: newMap,
    });

    setMap(newMap);
    setDirectionsRenderer(renderer);
  }, []);

  // /api/directions に送ってルートを取得
  const fetchRoute = async () => {
    if (points.length < 2) {
      alert("2地点以上追加してください。");
      return;
    }

    const res = await fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ points }),
    });

    const data = await res.json();

    if (!data || !data.routes || data.routes.length === 0) {
      alert("Google Directions API がルートを返しませんでした。");
      return;
    }

    setResult(data);

    // 地図に描画
    const r = data.routes[0]; // 1番目の候補を描画
    directionsRenderer.setDirections({
      routes: [
        {
          legs: r.legs,
          overview_polyline: r.overview_polyline
        }
      ],
    });
  };

  return (
    <div>
      <h1>ルート検索</h1>

      {/* 地点入力 */}
      <input
        type="text"
        placeholder="地点を入力して Enter"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setPoints([...points, e.target.value]);
            e.target.value = "";
          }
        }}
      />

      {/* 追加された地点の表示 */}
      <ul>
        {points.map((p, i) => (
          <li key={i}>{i + 1}. {p}</li>
        ))}
      </ul>

      {/* 検索ボタン */}
      <button onClick={fetchRoute}>ルート検索</button>

      {/* テキスト結果 */}
      {result && (
        <div>
          <h2>検索結果</h2>
          {result.routes.map((r, i) => (
            <div key={i}>
              <h3>候補 {i + 1}</h3>
              {r.legs.map((l, j) => (
                <p key={j}>
                  {l.start_address} → {l.end_address}
                  （{l.distance.text}, {l.duration.text}）
                </p>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 地図 */}
      <div
        id="map"
        style={{ width: "100%", height: "500px", marginTop: "20px" }}
      />
    </div>
  );
}
