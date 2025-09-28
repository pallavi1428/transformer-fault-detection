import Dashboard from "./Dashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Remove header from here since it's now in Dashboard */}
      <Dashboard />
    </div>
  );
}