import { useState, useEffect, useRef } from 'react';
import { usersAPI } from '../api/client';
import type { User } from '../types';

/**
 * Custom hook for fetching and caching the users list.
 * Prevents unnecessary API calls when the component remounts.
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);

    usersAPI.getAll()
      .then(data => {
        if (isMounted.current) {
          setUsers(data || []);
          setError(null);
        }
      })
      .catch(err => {
        if (isMounted.current) {
          console.error('Failed to load users:', err);
          setError(err);
        }
      })
      .finally(() => {
        if (isMounted.current) {
          setLoading(false);
        }
      });

    return () => {
      isMounted.current = false;
    };
  }, []);

  return { users, loading, error };
}

/**
 * Finds a user by ID from the users array.
 * Returns undefined if not found.
 */
export function findUserById(users: User[], id: number): User | undefined {
  return users.find(u => u.id === id);
}
