import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface Location {
  lat: number;
  lng: number;
  name?: string;
  type?: string;
  description?: string;
}

interface OpenStreetMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  locations?: Location[];
  onLocationClick?: (location: Location) => void;
  height?: string;
  className?: string;
}

// Custom marker icons
const createCustomIcon = (type?: string) => {
  const getColor = (type?: string) => {
    switch (type) {
      case 'disaster':
        return '#ef4444'; // red
      case 'resource':
        return '#10b981'; // green
      case 'hospital':
        return '#3b82f6'; // blue
      case 'shelter':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background-color: ${getColor(type)};
        border: 2px solid ${getColor(type)}20;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 12px;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">
        ${type ? type.charAt(0).toUpperCase() : 'L'}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Component to handle map center updates
const MapUpdater: React.FC<{ center: { lat: number; lng: number }; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom);
  }, [center, zoom, map]);
  
  return null;
};

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ 
  center = { lat: 40.7128, lng: -74.0060 }, 
  zoom = 10, 
  locations = [],
  onLocationClick,
  height = "400px",
  className = ""
}) => {
  const [popupInfo, setPopupInfo] = useState<Location | null>(null);

  const handleMarkerClick = useCallback((location: Location) => {
    setPopupInfo(location);
    if (onLocationClick) {
      onLocationClick(location);
    }
  }, [onLocationClick]);

  const getLocationTypeLabel = (type?: string) => {
    switch (type) {
      case 'disaster':
        return 'Disaster';
      case 'resource':
        return 'Resource';
      case 'hospital':
        return 'Hospital';
      case 'shelter':
        return 'Shelter';
      default:
        return 'Location';
    }
  };

  return (
    <div style={{ height, width: '100%' }} className={className}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <MapUpdater center={center} zoom={zoom} />
        
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Markers for locations */}
        {locations.map((location, index) => (
          <Marker
            key={index}
            position={[location.lat, location.lng]}
            icon={createCustomIcon(location.type)}
            eventHandlers={{
              click: () => handleMarkerClick(location),
            }}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {location.name || getLocationTypeLabel(location.type)}
                </h3>
                {location.type && (
                  <p className="text-xs text-gray-600 capitalize mb-1">
                    {getLocationTypeLabel(location.type)}
                  </p>
                )}
                {location.description && (
                  <p className="text-xs text-gray-700 mb-1">
                    {location.description}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default OpenStreetMap; 