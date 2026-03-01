import * as React from 'react';
import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { assets } from '@/config';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  alternateAction: {
    text: string;
    linkText: string;
    href: string;
  };
}

export function AuthLayout({
  children,
  title,
  subtitle,
  alternateAction,
}: AuthLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-bg-hero relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${assets.images.authHero}")`,
          }}
        >
          <div className="absolute inset-0 bg-primary/70" />
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-text-inverted">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Leaf className="h-10 w-10 text-white" />
            </div>
            <span className="text-4xl font-bold tracking-tight">RootShare</span>
          </div>

          <h1 className="text-3xl font-semibold text-center mb-4 max-w-md leading-relaxed">
            Grow Together, Share the Harvest
          </h1>
          <p className="text-lg text-white/80 text-center max-w-sm leading-relaxed">
            Connect with fellow urban gardeners, share your plants, and build a greener community.
          </p>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/30 to-transparent" />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-8 bg-bg-main">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="p-2 bg-primary-light rounded-lg">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-text-base">RootShare</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-text-base tracking-tight">
              {title}
            </h2>
            <p className="mt-2 text-text-muted">{subtitle}</p>
          </div>

          {children}

          <p className="mt-8 text-center text-sm text-text-muted">
            {alternateAction.text}{' '}
            <Link
              to={alternateAction.href}
              className="font-medium text-primary hover:text-primary-hover transition-colors"
            >
              {alternateAction.linkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
