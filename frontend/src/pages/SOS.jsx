import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  useLoadScript,
} from "@react-google-maps/api";
import api from "../api"; // make sure this points to backend base URL

const mapContainerStyle = {
  width: "100%",
  height: "60vh",
  borderRadius: "1rem",
};

const centerDefault = { lat: 12.9716, lng: 77.5946 }; // fallback

export default function SOS() {
  const [loc, setLoc] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_KEY",
    libraries: ["places"],
  });

  // ✅ Get current location
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Location not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
        };
        setLoc(current);
        fetchNearby(current);
      },
      (err) => toast.error("Location error: " + err.message),
      { enableHighAccuracy: true }
    );
  }, []);

  // ✅ Fetch nearby hospitals and police
  const fetchNearby = useCallback((current) => {
    if (!window.google) return;
    const service = new window.google.maps.places.PlacesService(
      document.createElement("div")
    );

    const searchTypes = ["hospital", "police"];
    let allResults = [];

    searchTypes.forEach((type) => {
      const request = {
        location: new window.google.maps.LatLng(current.lat, current.lng),
        radius: 3000,
        type,
      };
      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          allResults = [...allResults, ...results];
          setPlaces(allResults);
        }
      });
    });
  }, []);

  // ✅ Send SOS Alert
  const handleSOS = async () => {
    if (!user?.emergency_contacts?.length) {
      toast.error("No emergency contacts configured");
      return;
    }
    if (!loc) {
      toast.error("Location not ready");
      return;
    }

    setLoading(true);
    toast.loading("Sending SOS...");

    try {
      // Send to backend FastAPI route
      await api.post("/sos", {
        contacts: user.emergency_contacts,
        lat: loc.lat,
        lng: loc.lng,
      });

      toast.dismiss();
      toast.success("🚨 SOS alert sent successfully!");

      // Optional: auto-call first contact for demo
      if (user.emergency_contacts.length > 0) {
        const first = user.emergency_contacts[0];
        setTimeout(() => {
          window.location.href = `tel:${first}`;
        }, 2000);
      }
    } catch (err) {
      toast.dismiss();
      console.error("SOS error:", err);
      toast.error("Failed to send SOS alert");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Render
  if (loadError)
    return <div className="text-center text-red-500">Error loading map</div>;
  if (!isLoaded)
    return <div className="text-center text-gray-400">Loading map...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4 space-y-4">
      <h1 className="text-3xl font-bold text-red-500 text-center">
        SafePulse SOS
      </h1>

      {/* SOS Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSOS}
          disabled={loading}
          className={`w-56 h-56 rounded-full text-5xl font-extrabold shadow-2xl 
            ${loading ? "bg-gray-600" : "bg-red-600 hover:bg-red-700"} 
            ring-4 ring-red-400/40 animate-pulse focus:outline-none`}
        >
          {loading ? "..." : "SOS"}
        </button>
      </div>

      {/* Coordinates display */}
      {loc && (
        <div className="text-center text-sm text-gray-400">
          Latitude: {loc.lat.toFixed(4)} | Longitude: {loc.lng.toFixed(4)} | ±
          {Math.round(loc.acc)} m
        </div>
      )}

      {/* Google Map */}
      <div className="mt-4">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={14}
          center={loc || centerDefault}
          options={{
            styles: [
              { elementType: "geometry", stylers: [{ color: "#1f2937" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#1f2937" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#f9fafb" }] },
              { featureType: "poi.business", stylers: [{ visibility: "off" }] },
              { featureType: "poi.attraction", stylers: [{ visibility: "off" }] },
              { featureType: "poi.place_of_worship", stylers: [{ visibility: "off" }] },
            ],
            disableDefaultUI: true,
          }}
        >
          {/* Current Location */}
          {loc && (
            <Marker
              position={{ lat: loc.lat, lng: loc.lng }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
              }}
            />
          )}

          {/* Nearby hospitals/police */}
          {places.map((p, i) => (
            <Marker
              key={i}
              position={{
                lat: p.geometry.location.lat(),
                lng: p.geometry.location.lng(),
              }}
              onClick={() => setSelected(p)}
              icon={{
                url: p.types.includes("police")
                  ? "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                  : "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
              }}
            />
          ))}

          {/* InfoWindow */}
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
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    selected.name
                  )}&destination_place_id=${selected.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-xs hover:underline"
                >
                  🚗 Get Directions
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
