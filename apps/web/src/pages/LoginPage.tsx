import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Button, Input, Divider, ErrorAlert } from '../components/ui';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import { useAuthStore } from '../stores/auth.store';
import { loginUser, initiateGoogleAuth, getAuthErrorMessage } from '../lib/auth';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Get the redirect path from location state, or default to /feed
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/feed';

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await loginUser({ email: email.trim(), password });

      // Store tokens in localStorage via auth store
      setAuth(response.user, response.tokens);

      // Redirect to the intended page
      navigate(from, { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await initiateGoogleAuth();
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue"
      alternateAction={{
        text: "Don't have an account?",
        linkText: 'Create one',
        href: '/register',
      }}
    >
      <ErrorAlert message={error} className="mb-6" />

      {/* Google Sign In */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full mb-6 gap-3"
        onClick={handleGoogleLogin}
        isLoading={isGoogleLoading}
        disabled={isLoading}
      >
        {!isGoogleLoading && <GoogleIcon size={20} />}
        Continue with Google
      </Button>

      <Divider className="mb-6">or continue with email</Divider>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          error={fieldErrors.email}
          autoComplete="email"
          disabled={isLoading || isGoogleLoading}
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={fieldErrors.password}
            autoComplete="current-password"
            disabled={isLoading || isGoogleLoading}
          />
          <div className="mt-2 text-right">
            <a
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={isGoogleLoading}
        >
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
