import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Signup from "./pages/Signup";
import SOS from "./pages/SOS";
import MapPage from "./pages/MapPage";
import Profile from "./pages/Profile";
import Emergency from "./pages/Emergency";

function App() {
  const user = localStorage.getItem("user");

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* ✅ Show Navbar only after one-time setup */}
      {user && <Navbar />}

      {/* ✅ Define routes */}
      <Routes>
        {/* If user exists, go directly to SOS page; otherwise Signup */}
        <Route path="/" element={user ? <Navigate to="/sos" /> : <Signup />} />

        {/* Main pages */}
        <Route path="/sos" element={<SOS />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/profile" element={<Profile />} />

        {/* Redirect any unknown route to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* ✅ Global Toaster for notifications */}
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}

export default App;
