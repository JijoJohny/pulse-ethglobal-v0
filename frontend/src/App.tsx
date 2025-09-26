import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { RootstockWalletProvider } from './web3/provider';
import { AppRouter } from './routes/AppRouter';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

function App() {
  return (
    <RootstockWalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/*" element={<AppRouter />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </RootstockWalletProvider>
  );
}

export default App;
