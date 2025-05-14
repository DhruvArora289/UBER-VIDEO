import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fixing default icon issue in Leaflet with Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const containerStyle = {
  width: '100%',
  height: '100vh',
};

// Component to auto-move the map when position updates
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng]);
  }, [lat, lng]);
  return null;
};

const LiveTracking = () => {
  const [currentPosition, setCurrentPosition] = useState([28.6139, 77.2090]); // Default Delhi

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((position) => {
      const { latitude, longitude } = position.coords;
      setCurrentPosition([latitude, longitude]);
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <div style={containerStyle}>
      <MapContainer center={currentPosition} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={currentPosition}></Marker>
        <RecenterMap lat={currentPosition[0]} lng={currentPosition[1]} />
      </MapContainer>
    </div>
  );
};

export default LiveTracking;
