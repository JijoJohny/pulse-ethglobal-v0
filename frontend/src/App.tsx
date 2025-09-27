import { RootstockWalletProvider } from './web3/provider';
import { AppRouter } from './routes/AppRouter';

function App() {
  return (
    <RootstockWalletProvider>
      <AppRouter />
    </RootstockWalletProvider>
  );
}

export default App;
