import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { analytics } from '@/lib/analytics';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailCaptureProps {
  variant?: 'inline' | 'card';
  title?: string;
  description?: string;
}

export const EmailCapture = ({
  variant = 'inline',
  title = 'Stay Updated',
  description = 'Get notified about new features, tasks, and rewards.',
}: EmailCaptureProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    setIsSubmitting(true);

    try {
      // In production, this would call your email service API
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Track conversion
      analytics.trackEvent('Marketing', 'email_captured', data.email);

      setIsSubmitted(true);
      reset();
      toast.success('Thanks for subscribing!');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
      analytics.errorOccurred('email_capture', 'Subscription failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={variant === 'card' ? 'card text-center' : 'text-center py-4'}>
        <div className="text-green-500 text-4xl mb-2">✓</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          You're on the list!
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          We'll keep you updated on all things Task Chainz.
        </p>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="card bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="mb-4 opacity-90">{description}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Enter your email"
              {...register('email')}
              className="w-full px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-200">{errors.email.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white text-primary-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Subscribing...' : 'Subscribe'}
          </button>

          <p className="text-xs opacity-75 text-center">
            No spam, unsubscribe anytime.
          </p>
        </form>
      </div>
    );
  }

  // Inline variant
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="email"
          placeholder="Enter your email"
          {...register('email')}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary whitespace-nowrap"
      >
        {isSubmitting ? 'Subscribing...' : 'Get Updates'}
      </button>
    </form>
  );
};
