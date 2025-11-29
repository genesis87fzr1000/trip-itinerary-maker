// pages/index.js
import { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Polyline, Marker } from '@react-google-maps/api';

export default function Home() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [routeData, setRouteData] = useState(null);

  const containerStyle = {
    width: '100%',
    height: '500px'
  };

  const mapCenter = { lat: 35.681236, lng: 139.767125 }; // 東京駅あたり

  const calculateRoute = async () => {
    if (!from || !to) return;

    const response = await fetch(
      `/api/directions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    );
    const data = await response.json();
    setRouteData(data);
  };

  // polyline のポイントを LatLng に変換する関数
  const decodePolyline = (encoded) => {
    const points = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return points;
  };

  const polylinePath = routeData?.overview_polyline
    ? decodePolyline(routeData.overview_polyline.points)
    : [];

  const startMarker = routeData?.legs?.[0]?.start_location;
  const endMarker = routeData?.legs?.[0]?.end_location;

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

      {routeData && (
        <div style={{ marginTop: '20px' }}>
          <h3>ルート結果:</h3>
          <p>距離: {routeData.legs[0].distance.text}, 所要時間: {routeData.legs[0].duration.text}</p>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={13}
          >
            {polylinePath.length > 0 && (
              <>
                <Polyline
                  path={polylinePath}
                  options={{ strokeColor: '#FF0000', strokeWeight: 4 }}
                />
                {startMarker && <Marker position={startMarker} label="出発" />}
                {endMarker && <Marker position={endMarker} label="到着" />}
              </>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
}
