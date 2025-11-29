import { useState } from 'react';

export default function Home() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [route, setRoute] = useState('');

  const calculateRoute = async () => {
    if (!from || !to) return;

    const response = await fetch(
      `/api/directions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    const data = await response.json();
    setRoute(data.route);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Trip Itinerary Maker</h1>

      <div>
        <label>出発地: </label>
        <input value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div>
        <label>到着地: </label>
        <input value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <button onClick={calculateRoute}>ルート計算</button>

      {route && (
        <div style={{ marginTop: '20px' }}>
          <h3>ルート結果:</h3>
          <pre>{route}</pre>
        </div>
      )}
    </div>
  );
}
