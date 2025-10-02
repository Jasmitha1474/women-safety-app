import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergency, setEmergency] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const userData = { name, phone, emergency };
    localStorage.setItem("user", JSON.stringify(userData));
    navigate("/sos"); // redirect to SOS page
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-md w-80 flex flex-col gap-4"
      >
        <h1 className="text-2xl font-bold text-pink-500">Sign Up</h1>
        <input
          type="text"
          placeholder="Name"
          className="p-2 rounded text-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Phone"
          className="p-2 rounded text-black"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Emergency Contact"
          className="p-2 rounded text-black"
          value={emergency}
          onChange={(e) => setEmergency(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-pink-600 hover:bg-pink-700 py-2 rounded font-bold"
        >
          Save & Continue
        </button>
      </form>
    </div>
  );
}

