import React, { useState, useEffect, useRef } from 'react';
import Timer from './components/Timer';
import AdminPage from './components/AdminPage';
import { RiAdminFill  } from 'react-icons/ri';
import { saveToCSV, loadFromCSV } from './utils/fileHandler';
import DateTimeDisplay from './components/DateTimeDisplay';


function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [timerStates, setTimerStates] = useState({});
  const timerRefs = useRef({});
  const [rates, setRates] = useState(() => {
    const savedRates = localStorage.getItem('timerRates');
    if (savedRates) {
      return JSON.parse(savedRates);
    }
    return [
      { 
        id: 1, 
        rate: 1.00,
        scheduledRates: [
          { time: '00:00', rate: 1.00 },
          { time: '12:00', rate: 1.00 }
        ]
      },
      { 
        id: 2, 
        rate: 2.00,
        scheduledRates: [
          { time: '00:00', rate: 2.00 },
          { time: '12:00', rate: 2.00 }
        ]
      },
      { 
        id: 3, 
        rate: 3.00,
        scheduledRates: [
          { time: '00:00', rate: 3.00 },
          { time: '12:00', rate: 3.00 }
        ]
      }
    ];
  });

  // Initialize refs when rates change
  useEffect(() => {
    rates.forEach(rate => {
      if (!timerRefs.current[rate.id]) {
        timerRefs.current[rate.id] = React.createRef();
      }
    });
  }, [rates]);

  useEffect(() => {
    // Load configurations and history on startup
    const loadSavedData = async () => {
      try {
        const savedRates = localStorage.getItem('timerRates');
        if (savedRates) {
          setRates(JSON.parse(savedRates));
        }

        // Load history from localStorage if exists
        const savedHistory = localStorage.getItem('timerHistory');
        if (savedHistory) {
          // History is already in localStorage, no need to do anything
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };

    loadSavedData();
  }, []);

  const getCurrentRate = (timerRates) => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Find applicable rate based on time
    const [rate1, rate2] = timerRates.scheduledRates;
    return currentTime >= rate1.time && currentTime < rate2.time ? rate1.rate : rate2.rate;
  };

  const handleAdminClick = () => {
    // First pause all running timers
    Object.values(timerRefs.current).forEach(ref => {
      if (ref.current) {
        ref.current.pause();
      }
    });

    // Then save their states
    const states = {};
    Object.entries(timerRefs.current).forEach(([id, ref]) => {
      if (ref.current) {
        states[id] = ref.current.getState();
      }
    });

    setTimerStates(states);
    localStorage.setItem('timerStates', JSON.stringify(states));
    setIsAdmin(true);
  };

  const handleAdminClose = () => {
    const savedStates = JSON.parse(localStorage.getItem('timerStates') || '{}');
    setTimerStates(savedStates);
    setIsAdmin(false);
  };

  return (
    <div className="relative">
      <DateTimeDisplay />
      <button 
        onClick={handleAdminClick}
        className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
      >
        <RiAdminFill  className="w-6 h-6" />
      </button>
      
      {!isAdmin ? (
        <div className="text-center p-4">
          <h1 className="text-2xl font-bold mb-4">LC Snooker</h1>
          <div className="flex justify-center gap-5">
            {rates.map((rateConfig) => (
              <Timer 
                key={rateConfig.id}
                ref={timerRefs.current[rateConfig.id]}
                ratePerMinute={getCurrentRate(rateConfig)}
                order={rateConfig.id}
                scheduledRates={rateConfig.scheduledRates}
                savedState={timerStates[rateConfig.id]}
              />
            ))}
          </div>
        </div>
      ) : (
        <AdminPage 
          onClose={handleAdminClose} 
          rates={rates} 
          setRates={setRates}
        />
      )}
    </div>
  );
}

export default App; 