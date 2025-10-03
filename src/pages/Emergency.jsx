import Button from "../components/Button";

const Card = ({ title, number }) => (
  <div className="bg-gray-800 rounded-xl p-5 shadow">
    <div className="text-lg font-bold mb-2">{title}</div>
    <div className="text-2xl font-extrabold mb-4">{number}</div>
    <a href={`tel:${number}`}>
      <Button className="bg-pink-600 hover:bg-pink-700 text-white w-full">Call Now</Button>
    </a>
  </div>
);

export default function Emergency() {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-pink-500 mb-6">Emergency Numbers</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card title="Police" number="100" />
          <Card title="Ambulance" number="108" />
          <Card title="Women Helpline" number="1091" />
        </div>
      </div>
    </div>
  );
}

