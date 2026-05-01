import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/Auth/Login/LoginPage';
import { RegisterPage } from '@/pages/Auth/Register/RegisterPage';
import { AuthCallbackPage } from '@/pages/Auth/AuthCallbackPage';
import { FeedPage } from '@/pages/FeedPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { ProfilePage } from '@/pages/Profile/ProfilePage';
import { CommunityPage } from '@/pages/Community/CommunityPage';
import { AiChatPage } from '@/pages/AiChat/AiChatPage';
import { useAuthStore } from '@/stores/auth.store';
import { AppLayout } from '@/components/layouts/AppLayout';

function App(): JSX.Element {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Toaster position="bottom-right" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route path="/feed" element={isAuthenticated ? <AppLayout><FeedPage /></AppLayout> : <Navigate to="/login" />} />
        <Route
          path="/inventory"
          element={isAuthenticated ? <AppLayout><InventoryPage /></AppLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <AppLayout><ProfilePage /></AppLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/community"
          element={isAuthenticated ? <AppLayout><CommunityPage /></AppLayout> : <Navigate to="/login" />}
        />
        <Route
          path="/ai-chat"
          element={isAuthenticated ? <AppLayout><AiChatPage /></AppLayout> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
