import React from 'react';
import OpenStreetMap from './OpenStreetMap';

interface Location {
  lat: number;
  lng: number;
  name?: string;
  type?: string;
  description?: string;
}

interface UnifiedMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  locations?: Location[];
  onLocationClick?: (location: Location) => void;
  height?: string;
  className?: string;
}

const UnifiedMap: React.FC<UnifiedMapProps> = (props) => {
  // Use OpenStreetMap (free, no API key required)
  return <OpenStreetMap {...props} />;
};

export default UnifiedMap; 