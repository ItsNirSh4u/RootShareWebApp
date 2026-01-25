import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { Spinner, ErrorAlert } from '../components/ui';
import api from '../lib/api';
import { IUser } from '@rootshare/shared-types';

export function AuthCallbackPage(): JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async (): Promise<void> => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');

      if (!accessToken || !refreshToken) {
        setError('Authentication failed. Missing tokens.');
        return;
      }

      try {
        // Fetch user profile with the new access token
        const response = await api.get<IUser>('/auth/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Store auth data
        setAuth(response.data, { accessToken, refreshToken });

        // Redirect to feed
        navigate('/feed', { replace: true });
      } catch (err) {
        setError('Failed to complete authentication. Please try again.');
      }
    };

    handleCallback();
  }, [searchParams, setAuth, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-main px-4">
        <div className="w-full max-w-md text-center">
          <ErrorAlert message={error} className="mb-6" />
          <a
            href="/login"
            className="text-primary hover:text-primary-hover transition-colors font-medium"
          >
            Return to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-main">
      <Spinner size="lg" className="text-primary mb-4" />
      <p className="text-text-muted">Completing sign in...</p>
    </div>
  );
}
