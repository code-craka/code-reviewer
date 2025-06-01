// lib/utils/error-handler.ts
import { StorageError } from '@/lib/supabase/storage';
import { toast } from '@/hooks/use-toast';

/**
 * Error handler for storage operations
 * @param error The error to handle
 * @param fallbackMessage A fallback message if the error is not a StorageError
 */
export function handleStorageError(error: unknown, fallbackMessage = 'An error occurred during the storage operation'): void {
  console.error('Storage operation error:', error);
  
  if (error instanceof StorageError) {
    // Handle specific storage error codes
    switch (error.code) {
      case 'FILE_TOO_LARGE':
        toast({
          title: 'File Too Large',
          description: error.message,
          variant: 'destructive',
        });
        break;
      case 'INVALID_FILE_TYPE':
        toast({
          title: 'Invalid File Type',
          description: error.message,
          variant: 'destructive',
        });
        break;
      case 'UPLOAD_FAILED':
        toast({
          title: 'Upload Failed',
          description: 'Failed to upload file. Please try again later.',
          variant: 'destructive',
        });
        break;
      case 'DELETE_FAILED':
        toast({
          title: 'Delete Failed',
          description: 'Failed to delete file. Please try again later.',
          variant: 'destructive',
        });
        break;
      default:
        toast({
          title: 'Storage Error',
          description: error.message || fallbackMessage,
          variant: 'destructive',
        });
    }
  } else if (error instanceof Error) {
    toast({
      title: 'Error',
      description: error.message || fallbackMessage,
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Error',
      description: fallbackMessage,
      variant: 'destructive',
    });
  }
}

/**
 * Safely execute a storage operation with proper error handling
 * @param operation The storage operation to execute
 * @param fallbackValue The fallback value to return if the operation fails
 * @param errorMessage A custom error message to display if the operation fails
 * @returns The result of the operation or the fallback value
 */
export async function safeStorageOperation<T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  errorMessage = 'An error occurred during the storage operation'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    handleStorageError(error, errorMessage);
    return fallbackValue;
  }
}
