// pages/index.js
import { useState, useEffect, useCallback, useRef } from "react";

export default function Home() {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [map, setMap] = useState(null);

  const [waypoints, setWaypoints] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const [routes, setRoutes] = useState([]);          // API から返った全ルート
  const [selectedRoute, setSelectedRoute] = useState(null); // 一時選択ルート
  const [finalRoute, setFinalRoute] = useState(null);       // 確定ルート

  const allRenderersRef = useRef([]); // 全ルート描画用
  const finalRendererRef = useRef(null); // 確定ルート表示用

  // Google Maps 読み込み
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

  // Map 初期化
  useEffect(() => {
    if (!googleLoaded) return;

    const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
      center: { lat: 35.681236, lng: 139.767125 },
      zoom: 10,
    });

    setMap(mapInstance);
  }, [googleLoaded]);

  // --- Waypoint 追加 ---
  const addWaypoint = () => {
    if (!inputValue.trim()) return;
    setWaypoints((prev) => [...prev, inputValue.trim()]);
    setInputValue("");
  };

  // --- Directions API 呼び出し ---
  const calculateRoute = useCallback(async () => {
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

      if (!data.routes || data.routes.length === 0) {
        alert("Google Directions API がルートを返しませんでした。");
        return;
      }

      setRoutes(data.routes);
      setFinalRoute(null); // 確定解除
      renderAllRoutes(data.routes);
    } catch (error) {
      console.error(error);
      alert("ルート取得に失敗しました。");
    }
  }, [waypoints, map]);

  // --- 全ルートを薄く描画 ---
  const renderAllRoutes = (routes) => {
    // 古い描画を削除
    allRenderersRef.current.forEach((r) => r.setMap(null));
    allRenderersRef.current = [];

    if (!map) return;

    routes.forEach((route, index) => {
      const renderer = new google.maps.DirectionsRenderer({
        map,
        directions: { routes: [route] },
        routeIndex: 0,
        polylineOptions: {
          strokeOpacity: 0.4,
          strokeWeight: 5,
        },
      });
      allRenderersRef.current.push(renderer);
    });
  };

  // --- 選択ルートを濃く描画 ---
  const highlightRoute = (index) => {
    setSelectedRoute(index);
    if (!map || !routes[index]) return;

    // 既存の強調ルートを削除
    if (finalRendererRef.current) {
      finalRendererRef.current.setMap(null);
    }

    const renderer = new google.maps.DirectionsRenderer({
      map,
      directions: { routes: [routes[index]] },
      routeIndex: 0,
      polylineOptions: {
        strokeOpacity: 1.0,
        strokeWeight: 7,
      },
    });

    finalRendererRef.current = renderer;
  };

  // --- このルートに確定 ---
  const confirmRoute = () => {
    if (selectedRoute === null) {
      alert("ルートを選択してください。");
      return;
    }

    const route = routes[selectedRoute];
    setFinalRoute(route);

    // 全薄ルートを消す
    allRenderersRef.current.forEach((r) => r.setMap(null));

    // 確定ルートを太く描画
    highlightRoute(selectedRoute);

    alert("ルートを確定しました！");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Trip Itinerary Maker</h1>

      <div>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="地点名を入力"
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

      <button onClick={calculateRoute}>ルート計算</button>

      <div style={{ marginTop: 20 }}>
        <h3>検索結果（選択して確定できます）</h3>
        {routes.map((r, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              padding: 10,
              marginBottom: 10,
              cursor: "pointer",
              background: selectedRoute === i ? "#f0f0f0" : "white",
            }}
            onClick={() => highlightRoute(i)}
          >
            <b>経路 {i + 1}</b><br />
            距離: {r.legs[0].distance.text} / 所要時間: {r.legs[0].duration.text}
          </div>
        ))}

        {selectedRoute !== null && (
          <button onClick={confirmRoute} style={{ marginTop: 10 }}>
            このルートに確定
          </button>
        )}

        {finalRoute && (
          <div style={{ marginTop: 20, color: "green", fontWeight: "bold" }}>
            ✔ このルートが確定されました
          </div>
        )}
      </div>

      <div
        id="map"
        style={{ width: "100%", height: "500px", marginTop: 20 }}
      ></div>
    </div>
  );
}
