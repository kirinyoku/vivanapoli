import { useRouter } from 'next/navigation';
import { ApiError } from './api';

/**
 * Hook that provides an error handler for admin API calls.
 *
 * Its primary purpose is intercepting 401 Unauthorized responses:
 * when the admin token expires or is invalid, the handler clears the
 * stored token and redirects to the login page. For other errors it
 * extracts and returns the error message.
 */
export function useAdminAuth() {
  const router = useRouter();

  const handleApiError = (err: unknown): string => {
    // Handle 401 Unauthorized - redirect to login
    if (err instanceof ApiError && err.status === 401) {
      localStorage.removeItem('viva-admin-token');
      router.push('/admin/login');
      return 'Redirecting to login...';
    }

    return err instanceof Error ? err.message : 'An error occurred';
  };

  return { handleApiError };
}
