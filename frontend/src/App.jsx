import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from './pages/Dashboard';
import LoanRequestForm from './components/LoanRequestForm';
import AddPublicKey from './components/ConnectToWallet';
const App = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/request-loan/:friendId" element={<LoanRequestForm />} />
          <Route path="/add-public-key" element={<AddPublicKey />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
