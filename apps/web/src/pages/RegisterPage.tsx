import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layouts/AuthLayout';
import { Button, Input, Divider, ErrorAlert } from '../components/ui';
import { GoogleIcon } from '../components/icons/GoogleIcon';
import { useAuthStore } from '../stores/auth.store';
import { registerUser, initiateGoogleAuth, getAuthErrorMessage } from '../lib/auth';

interface FieldErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterPage(): JSX.Element {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    // Username validation
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    } else if (username.length > 30) {
      errors.username = 'Username must be less than 30 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain uppercase, lowercase, and a number';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const response = await registerUser({
        username: username.trim(),
        email: email.trim(),
        password,
      });

      // Store tokens in localStorage via auth store
      setAuth(response.user, response.tokens);

      // Redirect to feed after successful registration
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async (): Promise<void> => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await initiateGoogleAuth();
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setIsGoogleLoading(false);
    }
  };

  const clearFieldError = (field: keyof FieldErrors): void => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join the community of urban gardeners"
      alternateAction={{
        text: 'Already have an account?',
        linkText: 'Sign in',
        href: '/login',
      }}
    >
      <ErrorAlert message={error} className="mb-6" />

      {/* Google Sign Up */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full mb-6 gap-3"
        onClick={handleGoogleSignUp}
        isLoading={isGoogleLoading}
        disabled={isLoading}
      >
        {!isGoogleLoading && <GoogleIcon size={20} />}
        Continue with Google
      </Button>

      <Divider className="mb-6">or register with email</Divider>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Username"
          type="text"
          placeholder="plantlover42"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            clearFieldError('username');
          }}
          error={fieldErrors.username}
          autoComplete="username"
          disabled={isLoading || isGoogleLoading}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearFieldError('email');
          }}
          error={fieldErrors.email}
          autoComplete="email"
          disabled={isLoading || isGoogleLoading}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearFieldError('password');
          }}
          error={fieldErrors.password}
          autoComplete="new-password"
          disabled={isLoading || isGoogleLoading}
        />

        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearFieldError('confirmPassword');
          }}
          error={fieldErrors.confirmPassword}
          autoComplete="new-password"
          disabled={isLoading || isGoogleLoading}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={isLoading}
          disabled={isGoogleLoading}
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
