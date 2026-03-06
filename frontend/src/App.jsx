import { useState } from 'react';
import TicketForm from './components/TicketForm/TicketForm';
import TicketList from './components/TicketList/TicketList';
import StatsDashboard from './components/StatsDashboard/StatsDashboard';
import './App.css';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTicketCreated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="logo">🎫 Support Tickets</span>
        </div>
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <StatsDashboard refreshKey={refreshKey} />
          <TicketForm onTicketCreated={handleTicketCreated} />
        </aside>

        <section className="content">
          <TicketList refreshKey={refreshKey} />
        </section>
      </main>
    </div>
  );
}
