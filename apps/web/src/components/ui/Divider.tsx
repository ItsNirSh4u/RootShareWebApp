import * as React from 'react';
import { cn } from '../../lib/utils';

interface DividerProps {
  children?: React.ReactNode;
  className?: string;
}

export function Divider({ children, className }: DividerProps): JSX.Element {
  if (!children) {
    return <div className={cn('w-full border-t border-border-default', className)} />;
  }

  return (
    <div className={cn('relative', className)}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border-default" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-bg-main text-text-muted">{children}</span>
      </div>
    </div>
  );
}
