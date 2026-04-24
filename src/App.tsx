import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { Mechanic, TimeEntry } from './types';

export default function App() {
  const [loggedMechanic, setLoggedMechanic] = useState<Mechanic | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  const handleLogin = (mechanic: Mechanic, entry?: TimeEntry) => {
    if (entry) {
      setTimeEntries((prev) => [entry, ...prev]);
    }
    setLoggedMechanic(mechanic);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {loggedMechanic ? (
        <Dashboard 
          mechanic={loggedMechanic} 
          timeEntries={timeEntries}
          onLogout={() => setLoggedMechanic(null)} 
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}
