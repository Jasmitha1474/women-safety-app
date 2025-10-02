export default function Profile() {
  const user = JSON.parse(localStorage.getItem("user")) || {};

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-pink-500">Profile</h1>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Emergency Contact:</strong> {user.emergency}</p>
      </div>
    </div>
  );
}

