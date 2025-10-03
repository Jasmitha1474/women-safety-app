import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function Signup() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState(["", ""]); // minimum two
  const navigate = useNavigate();

  const addContact = () => setContacts((c) => [...c, ""]);
  const changeContact = (i, v) => setContacts((c) => c.map((x, idx) => (idx === i ? v : x)));
  const removeContact = (i) => setContacts((c) => c.filter((_, idx) => idx !== i));

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = contacts.map(c => c.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      alert("Please provide at least two emergency contacts.");
      return;
    }
    const user = { name: name.trim(), phone: phone.trim(), contacts: cleaned, silent: false };
    localStorage.setItem("user", JSON.stringify(user));
    navigate("/sos");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 w-full max-w-md p-8 rounded-2xl shadow-lg space-y-4">
        <h1 className="text-3xl font-bold text-center text-pink-500">Create your profile</h1>
        <p className="text-center text-gray-400 text-sm">One-time setup. You’ll land on the SOS screen next time.</p>

        <label className="block text-sm font-semibold">Name</label>
        <input
          className="w-full rounded-md p-3 text-black"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="block text-sm font-semibold">Phone</label>
        <input
          className="w-full rounded-md p-3 text-black"
          placeholder="Your phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

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
                  <Button className="bg-gray-600 hover:bg-gray-700 text-white" onClick={() => removeContact(idx)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-3">
            <Button className="bg-gray-600 hover:bg-gray-700 text-white w-full" type="button" onClick={addContact}>
              Add another contact
            </Button>
          </div>
        </div>

        <Button className="bg-pink-600 hover:bg-pink-700 text-white w-full mt-2" type="submit">
          Save and continue
        </Button>
      </form>
    </div>
  );
}
