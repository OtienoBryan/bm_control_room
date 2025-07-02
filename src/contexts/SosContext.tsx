import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SosData, sosService } from '../services/sosService';

interface SosContextType {
  hasActiveSos: boolean;
  activeSosCount: number;
  sosList: SosData[];
  isLoading: boolean;
  error: string | null;
  refreshSosList: () => Promise<void>;
}

const SosContext = createContext<SosContextType | undefined>(undefined);

const INITIAL_POLLING_INTERVAL = 5000; // Start with 5 seconds
const MAX_POLLING_INTERVAL = 30000; // Max 30 seconds
const BACKOFF_MULTIPLIER = 1.5;

export const SosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sosList, setSosList] = useState<SosData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasActiveSos, setHasActiveSos] = useState(false);
  const [activeSosCount, setActiveSosCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentPollingInterval, setCurrentPollingInterval] = useState(INITIAL_POLLING_INTERVAL);
  const consecutiveErrorsRef = useRef(0);
  const navigate = useNavigate();

  const fetchSosList = async () => {
    try {
      // Check for authentication
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        setSosList([]);
        setHasActiveSos(false);
        setActiveSosCount(0);
        setIsLoading(false);
        return;
      }

      console.log('Fetching SOS list...');
      const data = await sosService.getSosList();
      console.log('Raw SOS data:', data);
      
      setSosList(data);
      
      // Check for active SOS alerts
      const activeSos = data.filter(sos => sos.status === 'pending');
      const activeCount = activeSos.length;
      console.log('Active SOS details:', {
        count: activeCount,
        alerts: activeSos.map(sos => ({
          id: sos.id,
          type: sos.sos_type,
          guard: sos.guard_name,
          status: sos.status
        }))
      });
      
      const previousActiveCount = activeSosCount;
      setActiveSosCount(activeCount);
      setHasActiveSos(activeCount > 0);
      setError(null);
      
      // Reset polling interval on successful request
      consecutiveErrorsRef.current = 0;
      setCurrentPollingInterval(INITIAL_POLLING_INTERVAL);

      // If there are active SOS alerts, show notification and redirect
      if (activeCount > 0) {
        // Show notification
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
        }

        if (Notification.permission === 'granted') {
          new Notification('Active SOS Alert', {
            body: `There ${activeCount === 1 ? 'is' : 'are'} ${activeCount} active SOS alert${activeCount === 1 ? '' : 's'} requiring attention.`,
            requireInteraction: true
          });
        }

        // Redirect to SOS list if we just detected active SOS or if we're not already on the SOS list page
        if (previousActiveCount === 0 || !window.location.pathname.includes('sos-list')) {
          console.log('Redirecting to SOS list page...');
          navigate('/dashboard/sos-list', { replace: true });
        }
      }
    } catch (error) {
      console.error('Error fetching SOS list:', error);
      
      // Increment consecutive errors and implement exponential backoff
      consecutiveErrorsRef.current++;
      const newInterval = Math.min(
        currentPollingInterval * BACKOFF_MULTIPLIER,
        MAX_POLLING_INTERVAL
      );
      setCurrentPollingInterval(newInterval);
      
      setError(error instanceof Error ? error.message : 'Failed to fetch SOS list');
      console.error('Error setting up request:', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  // Set up periodic refresh for active SOS alerts with dynamic interval
  useEffect(() => {
    console.log('Setting up SOS context...');
    fetchSosList();

    const intervalId = setInterval(fetchSosList, currentPollingInterval);

    return () => {
      console.log('Cleaning up SOS context...');
      clearInterval(intervalId);
    };
  }, [currentPollingInterval]); // Re-create interval when polling interval changes

  return (
    <SosContext.Provider value={{
      hasActiveSos,
      activeSosCount,
      sosList,
      isLoading,
      error,
      refreshSosList: fetchSosList
    }}>
      {children}
    </SosContext.Provider>
  );
};

export function useSos(): SosContextType {
  const context = useContext(SosContext);
  if (context === undefined) {
    throw new Error('useSos must be used within a SosProvider');
  }
  return context;
} 
