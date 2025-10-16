// ✅ MapPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, Marker, InfoWindow, useLoadScript } from "@react-google-maps/api";
import { toast } from "react-hot-toast";

// ✅ keep libraries outside the component to avoid reloading warning
const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

const defaultCenter = { lat: 12.9716, lng: 77.5946 }; // fallback (Bangalore)

export default function MapPage() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);

  // ✅ use env key instead of hardcoding YOUR_API_KEY
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries, // 👈 now using static constant
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Location services not available");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentLocation(coords);
        findNearbyPlaces(coords);
      },
      (err) => toast.error("Location error: " + err.message),
      { enableHighAccuracy: true }
    );
  }, []);

  const findNearbyPlaces = useCallback((coords) => {
    if (!window.google || !coords) return;

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );
    const request = {
      location: new window.google.maps.LatLng(coords.lat, coords.lng),
      radius: 3000,
      type: ["hospital", "police"],
    };
    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        setPlaces(results);
      } else {
        toast.error("No nearby hospitals or police stations found");
      }
    });
  }, []);

  if (loadError)
    return <div className="text-center text-red-500">Error loading Google Maps</div>;
  if (!isLoaded)
    return <div className="text-center text-gray-400">Loading map...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <h1 className="text-3xl font-bold text-center text-pink-500 mt-4 mb-2">
        SafePulse Map
      </h1>

      <div className="flex-1">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={14}
          center={currentLocation || defaultCenter}
          options={{
            disableDefaultUI: false,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#f9fafb" }] },
            ],
          }}
        >
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
          )}

          {places.map((place, i) => (
            <Marker
              key={i}
              position={{
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }}
              onClick={() => setSelected(place)}
              icon={{
                url: place.types.includes("police")
                  ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  : "http://maps.google.com/mapfiles/ms/icons/hospitals.png",
              }}
            />
          ))}

          {selected && (
            <InfoWindow
              position={{
                lat: selected.geometry.location.lat(),
                lng: selected.geometry.location.lng(),
              }}
              onCloseClick={() => setSelected(null)}
            >
              <div>
                <h2 className="font-semibold text-gray-900">{selected.name}</h2>
                <p className="text-xs text-gray-700">{selected.vicinity}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <div className="text-center py-3 text-sm text-gray-400">
        {currentLocation
          ? "Showing nearby hospitals and police stations"
          : "Waiting for location..."}
      </div>
    </div>
  );
}
