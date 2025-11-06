// ✅ MapPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import { toast } from "react-hot-toast";

// ✅ Libraries needed for Places API
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

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
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

  // ✅ Search both hospital and police separately
  const findNearbyPlaces = useCallback((coords) => {
    if (!window.google || !coords) return;

    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );
    const allResults = [];

    const searchTypes = ["hospital", "police"];
    let completed = 0;

    searchTypes.forEach((type) => {
      const request = {
        location: new window.google.maps.LatLng(coords.lat, coords.lng),
        radius: 4000,
        type,
      };

      service.nearbySearch(request, (results, status) => {
        completed++;
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          allResults.push(
            ...results.map((r) => ({
              ...r,
              placeType: type,
            }))
          );
        }
        if (completed === searchTypes.length) {
          if (allResults.length === 0)
            toast.error("No nearby hospitals or police stations found");
          setPlaces(allResults);
        }
      });
    });
  }, []);

  if (loadError)
    return (
      <div className="text-center text-red-500">Error loading Google Maps</div>
    );
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
              // ✅ Dark theme and hide unwanted POIs
              { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#f9fafb" }] },
              { featureType: "poi.business", stylers: [{ visibility: "off" }] },
              { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
              { featureType: "poi.school", stylers: [{ visibility: "off" }] },
              { featureType: "poi.park", stylers: [{ visibility: "off" }] },
              { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
              { featureType: "transit", stylers: [{ visibility: "off" }] },
            ],
          }}
        >
          {/* ✅ Marker for current location */}
          {currentLocation && (
            <Marker
              position={currentLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
              }}
            />
          )}

          {/* ✅ Hospital and Police markers */}
          {places.map((place, i) => (
            <Marker
              key={i}
              position={{
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              }}
              onClick={() => setSelected(place)}
              icon={{
                url:
                  place.placeType === "hospital"
                    ? "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
                    : "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              }}
            />
          ))}

          {/* ✅ InfoWindow: Shows name + route link */}
          {selected && (
            <InfoWindow
              position={{
                lat: selected.geometry.location.lat(),
                lng: selected.geometry.location.lng(),
              }}
              onCloseClick={() => setSelected(null)}
            >
              <div className="text-gray-800">
                <h2 className="font-semibold">{selected.name}</h2>
                <p className="text-xs mb-2">{selected.vicinity}</p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    selected.name
                  )}&destination_place_id=${selected.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-medium hover:underline"
                >
                  🚗 Get Directions
                </a>
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
