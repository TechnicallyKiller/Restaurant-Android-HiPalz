import { SocketProvider } from './src/context/SocketContext';
import BillingScreen from './src/screens/BillingScreen';

const App = () => {
  return (
    <SocketProvider>
       <BillingScreen />
    </SocketProvider>
  );
};

export default App;