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
    <div className="min-h-screen flex flex-col">
      {/* Show Navbar only after one-time setup */}
      {user && <Navbar />}

      <Routes>
        {/* First time -> Signup, otherwise -> SOS */}
        <Route path="/" element={user ? <Navigate to="/sos" /> : <Signup />} />
        <Route path="/sos" element={<SOS />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>

      <Toaster position="top-center" />
    </div>
  );
}

export default App;
