import { User } from '../types';

export const initialUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin'
  }
];

export const getStoredUsers = (): User[] => {
  const stored = localStorage.getItem('pos_users');
  if (stored) {
    return JSON.parse(stored);
  }
  localStorage.setItem('pos_users', JSON.stringify(initialUsers));
  return initialUsers;
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem('pos_users', JSON.stringify(users));
};
