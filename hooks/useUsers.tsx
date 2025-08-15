import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';
import { v4 as uuidv4 } from 'uuid';

interface UserContextType {
  users: User[];
  addUser: (user: Omit<User, 'uid'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Load users from local constant
        setUsers(MOCK_USERS);
        setLoading(false);
    }, []);

    const addUser = useCallback(async (user: Omit<User, 'uid'>) => {
        try {
            const newUser: User = {
                ...user,
                uid: uuidv4(),
                isOnline: false, // Default offline status for new users
            };
            setUsers(prevUsers => [...prevUsers, newUser]);
        } catch (err: any) {
             console.error("Error adding user locally:", err);
             throw err;
        }
    }, []);
    
    const updateUser = useCallback(async (updatedUser: User) => {
       setUsers(prevUsers => prevUsers.map(u => u.uid === updatedUser.uid ? updatedUser : u));
    }, []);

    const removeUser = useCallback(async (userId: string) => {
        setUsers(prevUsers => prevUsers.filter(u => u.uid !== userId));
    }, []);

    return (
        <UserContext.Provider value={{ users, addUser, updateUser, removeUser, loading, error }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUsers = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUsers must be used within a UserProvider');
    }
    return context;
};