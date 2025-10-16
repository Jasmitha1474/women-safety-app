import { useEffect, useState } from "react";
import Button from "../components/Button";
import { toast } from "react-hot-toast";
import PinLock from "./PinLock";
import api from "../api";

export default function Profile() {
  const [unlocked, setUnlocked] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState(["", ""]);
  const [silent, setSilent] = useState(false);
  const [newPin, setNewPin] = useState("");

  const isValidIndianNumber = (num) => /^[6-9]\d{9}$/.test(num);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (!u.pin) setUnlocked(true);
    setName(u.name || "");
    setPhone(u.phone || "");
    setContacts(u.contacts?.length ? u.contacts : ["", ""]);
    setSilent(!!u.silent);
  }, []);

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  const changeContact = (i, v) =>
    setContacts((c) => c.map((x, idx) => (idx === i ? v : x)));
  const addContact = () => setContacts((c) => [...c, ""]);
  const removeContact = (i) => setContacts((c) => c.filter((_, idx) => idx !== i));

  const save = async () => {
    const cleanContacts = contacts.map((c) => c.trim()).filter(Boolean);
    if (!isValidIndianNumber(phone)) {
      toast.error("Please enter a valid 10-digit Indian phone number.");
      return;
    }
    for (let c of cleanContacts) {
      if (!isValidIndianNumber(c)) {
        toast.error(`Invalid emergency contact: ${c}`);
        return;
      }
    }
    if (cleanContacts.length < 2) {
      toast.error("Please keep at least two emergency contacts.");
      return;
    }
    if (newPin && newPin.length !== 4) {
      toast.error("PIN must be 4 digits.");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const updated = {
      name: name.trim(),
      phone: phone.trim(),
      pin: newPin.length === 4 ? newPin : user.pin,
      emergency_contacts: cleanContacts,
    };

    try {
      await api.post("/signup", updated);
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error("Failed to update backend");
    }

    localStorage.setItem("user", JSON.stringify(updated));
    setNewPin("");
  };

  const reset = () => {
    localStorage.removeItem("user");
    toast("Setup cleared. Reload to start over.");
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 w-full max-w-xl mt-10 p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-pink-500 mb-6">Profile</h1>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input
              className="w-full p-3 rounded-md text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Phone</label>
            <input
              className="w-full p-3 rounded-md text-black"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Emergency Contacts</div>
              <Button
                className="bg-gray-600 hover:bg-gray-700 text-white"
                onClick={addContact}
              >
                Add contact
              </Button>
            </div>
            <div className="space-y-2">
              {contacts.map((c, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="flex-1 p-3 rounded-md text-black"
                    placeholder={`Contact ${idx + 1} phone`}
                    value={c}
                    onChange={(e) => changeContact(idx, e.target.value)}
                  />
                  {contacts.length > 2 && (
                    <Button
                      className="bg-gray-600 hover:bg-gray-700 text-white"
                      onClick={() => removeContact(idx)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              id="silent"
              type="checkbox"
              checked={silent}
              onChange={(e) => setSilent(e.target.checked)}
            />
            <label htmlFor="silent" className="text-sm">
              Silent SOS (no sound/vibration when sending)
            </label>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Change PIN (optional)
            </label>
            <input
              type="password"
              maxLength={4}
              pattern="\d*"
              className="w-full p-3 rounded-md text-black"
              placeholder="Enter new 4-digit PIN"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={save}
          >
            Save changes
          </Button>
          <Button
            className="bg-gray-600 hover:bg-gray-700 text-white"
            onClick={reset}
          >
            Clear setup
          </Button>
        </div>
      </div>
    </div>
  );
}
