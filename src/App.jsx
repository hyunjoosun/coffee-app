import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';
import { CafeProvider } from './context/CafeContext';
import { OrderProvider } from './context/OrderContext';
import Login from './pages/Login';
import Home from './pages/Home';
import OrderNew from './pages/OrderNew';
import OrderCafe from './pages/OrderCafe';
import Orders from './pages/Orders';
import OrderSummary from './pages/OrderSummary';
import Team from './pages/Team';

function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <CafeProvider>
          <OrderProvider>
          <BrowserRouter basename="/coffee-app">
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/order/new" element={<OrderNew />} />
              <Route path="/order/cafe/:cafeId" element={<OrderCafe />} />
                <Route path="/orders" element={<Orders />} />
              <Route path="/orders/:id" element={<OrderSummary />} />
              <Route path="/team" element={<Team />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          </OrderProvider>
        </CafeProvider>
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;
