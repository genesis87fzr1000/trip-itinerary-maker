import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [directionsRenderer, setDirectionsRenderer] = useState(null);

  // 初期地図の表示
  useEffect(() => {
    if (!map && window.google) {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: { lat: 35.682839, lng: 139.759455 }, // 東京駅付近
        zoom: 13,
      });
      setMap(mapInstance);

      const renderer = new window.google.maps.DirectionsRenderer();
      renderer.setMap(mapInstance);
      setDirectionsRenderer(renderer);
    }
  }, [map]);

  // ルート計算
  const calculateRoute = async () => {
    if (!from || !to) return;

    const response = await fetch(
      `/api/directions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    const data = await response.json();

    if (!data.legs || data.legs.length === 0) {
      alert('ルートが見つかりませんでした。');
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: from,
        destination: to,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
        } else {
          alert('ルート描画に失敗しました: ' + status);
        }
      }
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Trip Itinerary Maker</h1>

      <div style={{ marginBottom: '10px' }}>
        <label>出発地: </label>
        <input value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>到着地: </label>
        <input value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <button onClick={calculateRoute}>ルート計算</button>

      <div
        ref={mapRef}
        style={{ width: '100%', height: '500px', marginTop: '20px' }}
      />
    </div>
  );
}
