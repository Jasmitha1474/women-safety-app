export default function MapPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-pink-500 mb-4">Map</h1>
        <div className="h-[520px] rounded-2xl bg-gray-800 grid place-items-center text-gray-400">
          Google Maps placeholder
        </div>
        <p className="text-sm text-gray-400 mt-3">
          Next: integrate Google Maps + Places API to locate nearby hospitals and police stations.
        </p>
      </div>
    </div>
  );
}
