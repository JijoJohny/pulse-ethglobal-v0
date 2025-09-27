import { MetamaskWalletProvider } from './web3/MetamaskWalletProvider';
import { AppRouter } from './routes/AppRouter';

function App() {
  return (
    <MetamaskWalletProvider>
      <AppRouter />
    </MetamaskWalletProvider>
  );
}

export default App;
