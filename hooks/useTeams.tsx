import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Team } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TeamContextType {
  teams: Team[];
  addTeam: (team: Omit<Team, 'id'>) => Promise<void>;
  updateTeam: (team: Team) => Promise<void>;
  removeTeam: (teamId: string) => Promise<void>;
  loading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Optionally load initial teams from localStorage or mock
    setTeams([]);
  }, []);

  const addTeam = useCallback(async (team: Omit<Team, 'id'>) => {
    const newTeam: Team = { ...team, id: uuidv4() };
    setTeams(prev => [...prev, newTeam]);
  }, []);

  const updateTeam = useCallback(async (team: Team) => {
    setTeams(prev => prev.map(t => t.id === team.id ? team : t));
  }, []);

  const removeTeam = useCallback(async (teamId: string) => {
    setTeams(prev => prev.filter(t => t.id !== teamId));
  }, []);

  return (
    <TeamContext.Provider value={{ teams, addTeam, updateTeam, removeTeam, loading }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeams = (): TeamContextType => {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeams must be used within a TeamProvider');
  return context;
};
