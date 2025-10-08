import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function Signup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState(["", ""]); // at least two
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  // Helper functions
  const addContact = () => setContacts((c) => [...c, ""]);
  const changeContact = (i, v) =>
    setContacts((c) => c.map((x, idx) => (idx === i ? v : x)));
  const removeContact = (i) =>
    setContacts((c) => c.filter((_, idx) => idx !== i));

  // Validate Indian phone numbers
  const isValidIndianNumber = (num) => /^[6-9]\d{9}$/.test(num);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = contacts.map((c) => c.trim()).filter(Boolean);

    // Validate user number
    if (!isValidIndianNumber(phone)) {
      alert("Please enter a valid 10-digit Indian phone number for yourself.");
      return;
    }

    // Validate emergency contacts
    for (let c of cleaned) {
      if (!isValidIndianNumber(c)) {
        alert(`Invalid emergency contact: ${c}`);
        return;
      }
    }

    if (cleaned.length < 2) {
      alert("Please provide at least two valid emergency contacts.");
      return;
    }

    if (pin.length !== 4) {
      alert("PIN must be exactly 4 digits.");
      return;
    }

    // Store user locally
    const user = {
      name: name.trim(),
      phone: phone.trim(),
      contacts: cleaned,
      silent: false,
      pin,
    };
    localStorage.setItem("user", JSON.stringify(user));
    navigate("/sos");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-lg space-y-4"
      >
        <h1 className="text-3xl font-bold text-center text-pink-500">
          Create your profile
        </h1>
        <p className="text-center text-gray-400 text-sm">
          One-time setup. You’ll land on the SOS screen next time.
        </p>

        {/* Name */}
        <label className="block text-sm font-semibold">Name</label>
        <input
          className="w-full rounded-md p-3 text-black"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Phone */}
        <label className="block text-sm font-semibold">Phone</label>
        <input
          className="w-full rounded-md p-3 text-black"
          placeholder="Your phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        {/* Emergency contacts */}
        <div className="pt-2">
          <div className="text-sm font-semibold mb-2">Emergency Contacts</div>
          <div className="space-y-2">
            {contacts.map((c, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  className="flex-1 rounded-md p-3 text-black"
                  placeholder={`Contact ${idx + 1} phone`}
                  value={c}
                  onChange={(e) => changeContact(idx, e.target.value)}
                  required={idx < 2}
                />
                {contacts.length > 2 && (
                  <Button
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                    type="button"
                    onClick={() => removeContact(idx)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white w-full"
              type="button"
              onClick={addContact}
            >
              Add another contact
            </Button>
          </div>
        </div>

        {/* PIN */}
        <label className="block text-sm font-semibold">Set PIN (4 digits)</label>
        <input
          type="password"
          maxLength={4}
          pattern="\d*"
          className="w-full rounded-md p-3 text-black mb-4"
          placeholder="1234"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
        />

        <Button
          className="bg-pink-600 hover:bg-pink-700 text-white w-full mt-2"
          type="submit"
        >
          Save and continue
        </Button>
      </form>
    </div>
  );
}
