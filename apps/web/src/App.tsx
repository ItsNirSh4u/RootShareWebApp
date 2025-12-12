import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeedPage } from './pages/FeedPage';
import { InventoryPage } from './pages/InventoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { useAuthStore } from './stores/auth.store';

function App(): JSX.Element {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/feed"
          element={isAuthenticated ? <FeedPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/inventory"
          element={isAuthenticated ? <InventoryPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
