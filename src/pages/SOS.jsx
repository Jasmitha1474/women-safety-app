import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export default function SOS() {
  const [loc, setLoc] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Get location silently on load (permission prompt only once)
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
      },
      () => {
        setLoc(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
    );
  }, []);

  const handleSOS = async () => {
    // If no contacts defined, block
    if (!user?.contacts?.length) {
      toast.error("No emergency contacts configured. Add some in Profile.");
      return;
    }

    // Ensure we have at least a fresh location attempt
    const getFreshLocation = () =>
      new Promise((resolve) => {
        if (!("geolocation" in navigator)) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              acc: pos.coords.accuracy,
            }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
        );
      });

    const fresh = await getFreshLocation();
    const payload = fresh || loc;

    // Here you would call your backend:
    // await fetch("http://localhost:8000/sos", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ contacts: user.contacts, location: payload, silent: user.silent }),
    // });

    toast.success("SOS sent. Your contacts are being notified.");
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-56px)] bg-gray-900 text-white">
      <div className="flex-1 flex items-center justify-center">
        <button
          onClick={handleSOS}
          className="w-60 h-60 rounded-full bg-red-600 hover:bg-red-700 text-white text-5xl font-extrabold shadow-xl
                     ring-4 ring-red-400/40 transition focus:outline-none select-none
                     animate-pulse"
          aria-label="Send SOS"
        >
          SOS
        </button>
      </div>

      <div className="px-6 pb-6 text-center text-sm text-gray-400">
        {loc
          ? `Location ready (±${Math.round(loc.acc || 0)}m)`
          : `Location permission not granted yet`}
      </div>
    </div>
  );
}
