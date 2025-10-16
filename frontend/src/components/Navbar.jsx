import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const item = (to, label) => (
    <Link
      key={to}
      to={to}
      className={`px-2 py-1 rounded ${
        pathname === to ? "text-white font-bold underline" : "text-gray-100"
      } hover:text-white`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-pink-600 px-6 py-3 flex justify-between items-center shadow-lg">
      <div className="text-xl font-extrabold tracking-wide">SafePulse</div>
      <div className="flex gap-5">
        {item("/sos", "SOS")}
        {item("/map", "Map")}
        {item("/emergency", "Emergency Numbers")}
        {item("/profile", "Profile")}
      </div>
    </nav>
  );
}

