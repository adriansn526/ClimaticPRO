import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  href?: string;
}

// We use a discriminated union or intersection, but for simplicity in this project:
// If href is present, it renders Link. If not, button.
// Types are tricky with forwardRef + conditional rendering of different elements.
// casting ref or props loosely is acceptable here for strict time constraints.

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps & { target?: string }>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, href, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-lg hover:shadow-xl',
      secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 shadow-lg hover:shadow-xl',
      outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100',
      ghost: 'text-primary-500 hover:bg-primary-50 active:bg-primary-100',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const classes = cn(baseStyles, variants[variant], sizes[size], className);

    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          {...(props as any)} // Link props
        >
          {children}
        </Link>
      );
    }

    return (
      <button
        ref={ref as any}
        className={classes}
        disabled={disabled || isLoading}
        suppressHydrationWarning
        {...props}
      >
        {isLoading ? (
          <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
