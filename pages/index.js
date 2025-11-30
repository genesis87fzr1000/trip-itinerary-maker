// pages/index.js
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [map, setMap] = useState(null);

  const [waypoints, setWaypoints] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const [segments, setSegments] = useState([]); // ← サーバー側に合わせて修正
  const [selected, setSelected] = useState({ seg: null, route: null });

  const segmentRenderers = useRef([]); // 各区間の候補ルート表示用
  const highlightRenderer = useRef(null); // 選択ルート表示用

  // -------------------------------------------------------
  // Google Maps Script 読み込み
  // -------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.google && window.google.maps) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);
  }, []);

  // -------------------------------------------------------
  // 地図初期化
  // -------------------------------------------------------
  useEffect(() => {
    if (!googleLoaded) return;

    const instance = new google.maps.Map(document.getElementById("map"), {
      center: { lat: 35.681236, lng: 139.767125 },
      zoom: 10,
    });

    setMap(instance);
  }, [googleLoaded]);

  // -------------------------------------------------------
  // 地点追加
  // -------------------------------------------------------
  const addWaypoint = () => {
    if (!inputValue.trim()) return;
    setWaypoints((prev) => [...prev, inputValue.trim()]);
    setInputValue("");
  };

  // -------------------------------------------------------
  // ルート計算（サーバーキー経由）
  // -------------------------------------------------------
  const calculateRoutes = async () => {
    if (waypoints.length < 2) {
      alert("2箇所以上を入力してください。");
      return;
    }

    try {
      const res = await fetch("/api/directions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waypoints }),
      });

      const data = await res.json();

      if (!data.segments || data.segments.length === 0) {
        alert("Google Directions API がルートを返しませんでした。");
        return;
      }

      setSegments(data.segments);

      clearAllRenderers();
      renderAllSegments(data.segments);

    } catch (err) {
      console.error(err);
      alert("サーバーでルート取得に失敗しました");
    }
  };

  // -------------------------------------------------------
  // 全区間の候補ルートを薄く描画
  // -------------------------------------------------------
  const renderAllSegments = (segmentsData) => {
    if (!map) return;

    clearAllRenderers();

    segmentsData.forEach((seg, sIdx) => {
      segmentRenderers.current[sIdx] = [];

      seg.routes.forEach((route, rIdx) => {
        const renderer = new google.maps.DirectionsRenderer({
          map,
          directions: { routes: [route] },
          suppressMarkers: false,
          polylineOptions: { strokeOpacity: 0.25, strokeWeight: 4 },
        });

        segmentRenderers.current[sIdx][rIdx] = renderer;
      });
    });
  };

  const clearAllRenderers = () => {
    segmentRenderers.current.forEach((seg) =>
      seg?.forEach((r) => r?.setMap(null))
    );
    segmentRenderers.current = [];
  };

  const clearHighlight = () => {
    if (highlightRenderer.current) {
      highlightRenderer.current.setMap(null);
    }
    highlightRenderer.current = null;
  };

  // -------------------------------------------------------
  // 任意のルートを選択して強調表示
  // -------------------------------------------------------
  const highlightRoute = (sIdx, rIdx) => {
    if (!segments[sIdx] || !segments[sIdx].routes[rIdx]) return;

    setSelected({ seg: sIdx, route: rIdx });

    clearHighlight();

    const renderer = new google.maps.DirectionsRenderer({
      map,
      directions: { routes: [segments[sIdx].routes[rIdx]] },
      suppressMarkers: false,
      polylineOptions: { strokeOpacity: 1.0, strokeWeight: 6 },
    });

    highlightRenderer.current = renderer;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Trip Itinerary Maker（ServerKey 版）</h1>

      {/* ------------------------------------ */}
      {/* 入力 */}
      {/* ------------------------------------ */}
      <div>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="地点名を入力（例: 新宿駅）"
        />
        <button onClick={addWaypoint}>追加</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <h3>追加された地点</h3>
        <ul>
          {waypoints.map((p, i) => (
            <li key={i}>{i + 1}. {p}</li>
          ))}
        </ul>
      </div>

      <button onClick={calculateRoutes}>ルート計算</button>

      {/* ------------------------------------ */}
      {/* ルート候補一覧 */}
      {/* ------------------------------------ */}
      <div style={{ marginTop: 20 }}>
        <h2>検索結果（区間ごとの候補）</h2>

        {segments.map((seg, sIdx) => (
          <div key={sIdx} style={{ marginBottom: 20 }}>
            <h3>
              区間 {sIdx + 1}：{seg.from} → {seg.to}
            </h3>

            {seg.routes.map((route, rIdx) => (
              <div
                key={rIdx}
                onClick={() => highlightRoute(sIdx, rIdx)}
                style={{
                  border: "1px solid #ccc",
                  padding: 10,
                  marginBottom: 10,
                  cursor: "pointer",
                  background:
                    selected.seg === sIdx && selected.route === rIdx
                      ? "#eef"
                      : "white",
                }}
              >
                <b>候補 {rIdx + 1}</b><br />
                距離：{route.legs[0].distance.text} / 
                時間：{route.legs[0].duration.text}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ------------------------------------ */}
      {/* 地図 */}
      {/* ------------------------------------ */}
      <div
        id="map"
        style={{ width: "100%", height: "500px", marginTop: 20 }}
      ></div>
    </div>
  );
}
