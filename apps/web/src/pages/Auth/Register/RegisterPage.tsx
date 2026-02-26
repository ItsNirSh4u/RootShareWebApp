import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/layouts/AuthLayout';
import { Button, Input, Divider, ErrorAlert } from '../../../components/ui';
import { GoogleIcon } from '../../../components/icons/GoogleIcon';
import { useAuthStore } from '../../../stores/auth.store';
import {
  registerUser,
  initiateGoogleAuth,
  getAuthErrorMessage,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../auth';

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
    const usernameError = validateUsername(username, 'REGISTER');
    const emailError = validateEmail(email, 'REGISTER');
    const passwordError = validatePassword(password, 'REGISTER');
    const confirmPasswordError = validateConfirmPassword(password, confirmPassword);

    if (usernameError) errors.username = usernameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
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

      setAuth(response.user, response.tokens);

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
