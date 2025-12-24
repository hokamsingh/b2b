import { useEffect, useState } from 'react';

function App() {
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use relative path so it works on any subdomain (john.example.com/api/...)
    // In local dev (Vite), we need a proxy or full URL.
    // For Production demo, we assume the Frontend is served on the same domain as API.
    const apiUrl = import.meta.env.PROD ? '/api/user/config' : 'http://localhost:5001/api/user/config';

    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        setTheme(data.theme || 'light');
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load theme', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className={`min-h-screen p-4 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Tenant User Frontend</h1>
        <p>Current Theme: {theme}</p>
      </header>
      <main>
        <p>Welcome to the user portal.</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Action Button
        </button>
      </main>
    </div>
  );
}

export default App;
