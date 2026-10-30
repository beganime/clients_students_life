import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { GuestHome } from './GuestHome';
import { StudentHome } from './StudentHome';

export function HomeScreen() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? <StudentHome /> : <GuestHome />;
}
