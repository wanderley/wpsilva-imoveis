import {
  Map as GoogleMap,
  MapCameraChangedEvent,
  Marker,
} from "@vis.gl/react-google-maps";
import { useState } from "react";

interface MapProps {
  latitude: number;
  longitude: number;
  address: string;
}

export function Map({ latitude, longitude, address }: MapProps) {
  const [zoom, setZoom] = useState(16);
  const [center, setCenter] = useState({ lat: latitude, lng: longitude });

  return (
    <GoogleMap
      zoom={zoom}
      center={center}
      gestureHandling="auto"
      scrollwheel={true}
      zoomControl={true}
      streetViewControl={true}
      fullscreenControl={true}
      className="w-full h-[400px] rounded-lg border border-border"
      onBoundsChanged={(event: MapCameraChangedEvent) => {
        setZoom(event.detail.zoom);
        setCenter(event.detail.center);
      }}
    >
      <Marker position={{ lat: latitude, lng: longitude }} title={address} />
    </GoogleMap>
  );
}
