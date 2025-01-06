import { Lot } from "@/features/auction/scrap/grid/api";
import { LotCardContent } from "@/features/auction/scrap/grid/components/LotCard";
import {
  Map as GoogleMap,
  InfoWindow,
  MapCameraChangedEvent,
  Marker,
} from "@vis.gl/react-google-maps";
import { useState } from "react";

interface LotsMapProps {
  lots: Lot[];
}

export function LotsMap({ lots }: LotsMapProps) {
  const [zoom, setZoom] = useState(12);
  const validLots = lots.filter(
    (lot) => lot.validatedAddress?.validation_status === "valid",
  );

  const [center, setCenter] = useState({
    lat: validLots[0]?.validatedAddress?.latitude || -23.5505,
    lng: validLots[0]?.validatedAddress?.longitude || -46.6333,
  });
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);

  if (validLots.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50 rounded-lg border border-border">
        <p className="text-gray-500">
          Nenhum lote com endereço validado encontrado
        </p>
      </div>
    );
  }

  return (
    <GoogleMap
      zoom={zoom}
      center={center}
      gestureHandling="auto"
      scrollwheel={true}
      zoomControl={true}
      streetViewControl={true}
      fullscreenControl={true}
      className="w-full h-[calc(100vh-200px)] rounded-lg border border-border"
      onBoundsChanged={(event: MapCameraChangedEvent) => {
        setZoom(event.detail.zoom);
        setCenter(event.detail.center);
      }}
    >
      {validLots.map((lot) => (
        <Marker
          key={lot.id}
          position={{
            lat: lot.validatedAddress!.latitude,
            lng: lot.validatedAddress!.longitude,
          }}
          title={lot.name || ""}
          onClick={() => setSelectedLot(lot)}
        />
      ))}

      {selectedLot && selectedLot.validatedAddress && (
        <InfoWindow
          position={{
            lat: selectedLot.validatedAddress.latitude,
            lng: selectedLot.validatedAddress.longitude,
          }}
          onCloseClick={() => setSelectedLot(null)}
        >
          <LotCardContent lot={selectedLot} mode="new-page" />
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
