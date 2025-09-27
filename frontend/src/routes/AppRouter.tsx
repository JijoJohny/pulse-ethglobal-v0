import { Routes, Route } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Markets from '../pages/Markets';
import Positions from '../pages/Positions';
import Analytics from '../pages/Analytics';
import Profile from '../pages/Profile';
import WalletTestPage from '../pages/WalletTest';
import NotFound from '../pages/NotFound';

// Layout Components
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

export function AppRouter() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/markets/:id" element={<Markets />} />
          <Route path="/positions" element={<Positions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/wallet-test" element={<WalletTestPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
