import React, { useEffect, useMemo, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export default function Map() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  const [foundMarkers, setFoundMarkers] = useState([]);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "foundItems"));
      const points = snap.docs
        .map((d) => {
          const data = d.data();
          const lat = data.lat;
          const lng = data.lng;
          if (typeof lat === "number" && typeof lng === "number") {
            return { id: d.id, position: { lat, lng } };
          }
          return null;
        })
        .filter(Boolean);

      setFoundMarkers(points);
    })();
  }, []);

  const center = useMemo(
    () => (foundMarkers[0]?.position ?? { lat: 52.4862, lng: -1.8904 }),
    [foundMarkers]
  );

  if (loadError) return <div>Map failed to load.</div>;
  if (!isLoaded) return <div>Loading map…</div>;

  return (
    <div className="map-page">
      <div className="map-card">
        <div className="map-card__header">
          <h2 className="map-card__title">Found items</h2>
          <span className="map-card__pill">{foundMarkers.length} pins</span>
        </div>

        <div className="map-card__frame">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={13}
            options={{
              disableDefaultUI: true,
              zoomControl: true,
              fullscreenControl: true,
            }}
          >
            {foundMarkers.map((m) => (
              <Marker key={m.id} position={m.position} />
            ))}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
}
