import { cn } from '../../lib/utils';

interface ErrorAlertProps {
  message: string | null;
  className?: string;
}

export function ErrorAlert({ message, className }: ErrorAlertProps): JSX.Element | null {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        'p-4 rounded-md bg-destructive/10 border border-destructive/20',
        className
      )}
      role="alert"
    >
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}
