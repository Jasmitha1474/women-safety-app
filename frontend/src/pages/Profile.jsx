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

  // 🧩 Load user info from localStorage or backend
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");

    if (!u.pin) setUnlocked(true);

    setName(u.name || "");
    setPhone(u.phone || "");
    setContacts(
      u.emergency_contacts?.length
        ? u.emergency_contacts
        : u.contacts?.length
        ? u.contacts
        : ["", ""]
    );
    setSilent(!!u.silent);

    // Fetch latest from backend if phone exists
    if (u.phone) {
      api
        .get(`/profile/${u.phone}`)
        .then((res) => {
          const data = res.data;
          setName(data.name || "");
          setPhone(data.phone || "");
          setContacts(
            data.emergency_contacts?.length
              ? data.emergency_contacts
              : ["", ""]
          );
          setSilent(!!data.silent);
          // Merge pin from local storage to preserve unlock access
          localStorage.setItem(
            "user",
            JSON.stringify({ ...data, pin: u.pin || "" })
          );
        })
        .catch((err) => {
          console.warn("Profile fetch failed:", err);
        });
    }
  }, []);

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  // 🧩 Contact handling
  const changeContact = (i, v) =>
    setContacts((c) => c.map((x, idx) => (idx === i ? v : x)));
  const addContact = () => setContacts((c) => [...c, ""]);
  const removeContact = (i) =>
    setContacts((c) => c.filter((_, idx) => idx !== i));

  // 🧩 Save profile
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

    // Always send the correct PIN (new one if entered, else stored one)
    const pinToSend =
      newPin && newPin.length === 4 ? newPin : user.pin || "";

    if (!pinToSend) {
      toast.error("PIN missing — please enter your current or new PIN.");
      return;
    }

    const updated = {
      name: name.trim(),
      phone: phone.trim(),
      pin: pinToSend,
      emergency_contacts: cleanContacts,
      contacts: cleanContacts, // for backward compatibility
      silent,
    };

    try {
      await api.post("/signup", updated);
      // Store latest info locally
      localStorage.setItem("user", JSON.stringify(updated));
      setNewPin("");
      toast.success("Profile updated successfully!");
    } catch (err) {
      console.error("Profile save failed:", err);
      toast.error("Failed to update backend");
    }
  };

  // 🧩 Reset setup
  const reset = () => {
    localStorage.removeItem("user");
    toast("Setup cleared. Reload to start over.");
    setName("");
    setPhone("");
    setContacts(["", ""]);
    setNewPin("");
    setSilent(false);
  };

  // 🧩 UI
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-start justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 w-full max-w-xl mt-10 p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold text-pink-500 mb-6">Profile</h1>

        <div className="grid grid-cols-1 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold mb-1">Name</label>
            <input
              className="w-full p-3 rounded-md text-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold mb-1">Phone</label>
            <input
              className="w-full p-3 rounded-md text-black"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Emergency Contacts */}
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

          {/* Silent Mode */}
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

          {/* Change PIN */}
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

        {/* Buttons */}
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
