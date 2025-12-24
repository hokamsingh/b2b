export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Tenant Config</h2>
            <p className="text-gray-600">Manage your tenant settings, logo, and theme.</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Analytics</h2>
            <p className="text-gray-600">View usage stats and logs.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
