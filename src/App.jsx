import { Routes, Route, Navigate, Link } from "react-router-dom";
import Signup from "./pages/Signup";
import SOS from "./pages/SOS";
import MapPage from "./pages/MapPage";
import Profile from "./pages/Profile";

function App() {
  const user = localStorage.getItem("user");

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar for development navigation */}
      <nav className="bg-pink-600 p-4 flex gap-6 font-bold">
        <Link to="/sos">SOS</Link>
        <Link to="/map">Map</Link>
        <Link to="/profile">Profile</Link>
      </nav>

      {/* Page Routes */}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/sos" /> : <Signup />} />
        <Route path="/sos" element={<SOS />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;
