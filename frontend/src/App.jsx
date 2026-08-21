import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            <main className="main-content">
              <AppRoutes />
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
