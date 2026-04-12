import { useRouter } from 'next/navigation';
import { ApiError } from './api';

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
