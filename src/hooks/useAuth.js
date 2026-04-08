import { useState, useEffect } from 'react';
import { authStore } from '../store/authStore';

export function useAuth() {
  const [state, setState] = useState(authStore.getState());

  useEffect(() => {
    return authStore.subscribe(setState);
  }, []);

  return state;
}
