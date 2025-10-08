import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function PinLock({ onUnlock }) {
  const [pin, setPin] = useState("");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const checkPin = (e) => {
    e.preventDefault();
    if (pin === user.pin) {
      onUnlock();
    } else {
      toast.error("Incorrect PIN");
      setPin("");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <form onSubmit={checkPin} className="bg-gray-800 p-8 rounded-xl shadow-lg w-80">
        <h1 className="text-xl font-bold mb-4 text-center">Enter PIN</h1>
        <input
          type="password"
          maxLength={4}
          pattern="\d*"
          className="w-full p-3 rounded-md text-black mb-4 text-center tracking-widest text-lg"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="****"
          required
        />
        <button className="bg-pink-600 hover:bg-pink-700 w-full py-2 rounded-md font-semibold">
          Unlock
        </button>
        <p className="text-sm text-gray-400 mt-3 text-center cursor-pointer" onClick={() => navigate("/sos")}>
          ← Back to SOS
        </p>
      </form>
    </div>
  );
}

