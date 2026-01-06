import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-100 text-primary-700 border-primary-200',
      secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
      success: 'bg-green-100 text-green-700 border-green-200',
      warning: 'bg-amber-100 text-amber-700 border-amber-200',
      danger: 'bg-red-100 text-red-700 border-red-200',
    };
    
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
