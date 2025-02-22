import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

const Timer = forwardRef(({ ratePerMinute, order, scheduledRates, savedState }, ref) => {
  const [time, setTime] = useState(savedState?.time || 0);
  const [isRunning, setIsRunning] = useState(false); // Always start paused
  const [totalCost, setTotalCost] = useState(0); // Initialize total cost to zero
  const [history, setHistory] = useState(savedState?.history || []);
  const [startTime, setStartTime] = useState(savedState?.startTime ? new Date(savedState.startTime) : null);
  const [currentCost, setCurrentCost] = useState(0); // Initialize current cost to zero
  const [prevCost, setPrevCost] = useState(0); 
  const [currentRate, setCurrentRate] = useState(savedState?.currentRate || ratePerMinute);
  
  // Effect to handle saved state restoration
  useEffect(() => {
    if (savedState) {
      setTime(savedState.time);
      setTotalCost(savedState.totalCost || 0); // Restore total cost
      setHistory(savedState.history);
      setStartTime(savedState.startTime ? new Date(savedState.startTime) : null);
      setCurrentCost(savedState.currentCost || 0); // Restore current cost
      setCurrentRate(savedState.currentRate || ratePerMinute);
    }
  }, [savedState]);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    pause: () => {
      setIsRunning(false);
    },
    getState: () => ({
      time,
      isRunning,
      totalCost,
      history,
      startTime: startTime?.toISOString(), // Convert Date to string for storage
      currentCost,
      currentRate
    })
  }));

  // Timer effect
  useEffect(() => {
    let intervalId;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime + 1;
          const prevMinute = Math.floor(prevTime / 60) ;
          const minutes = Math.floor(newTime / 60);
          // Update costs only when a new minute starts
          if(minutes > prevMinute) {
            const newCost = currentCost + currentRate;
            setCurrentCost(newCost);
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, currentRate, currentCost]);


  // Rate checking effect
  useEffect(() => {
    let intervalId;
    if (isRunning) {
      const checkRate = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const [rate1, rate2] = scheduledRates;
        const newRate = currentTime >= rate1.time && currentTime < rate2.time ? rate1.rate : rate2.rate;
        if (newRate !== currentRate) {
          setCurrentRate(newRate); // Add the new cost to the current cost
        }
      };

      checkRate();
      intervalId = setInterval(checkRate, 60000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning, scheduledRates, time, currentRate]);

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(new Date());
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    const endTime = new Date();
    // Reset current cost to zero after stopping
    const historyRecord = {
      timerId: order,
      startDate: formatDate(startTime),
      startTime: formatDateTime(startTime),
      endTime: formatDateTime(endTime),
      duration: formatTime(time),
      cost: currentCost,
      timestamp: Date.now()
    };

    // Save to localStorage only
    const allHistory = JSON.parse(localStorage.getItem('timerHistory') || '[]');
    const newHistory = [historyRecord, ...allHistory];
    localStorage.setItem('timerHistory', JSON.stringify(newHistory));
    
    setHistory(prev => {
      const newHistory = [historyRecord, ...prev];
      return newHistory.sort((a, b) => b.timestamp - a.timestamp);
    });
    setPrevCost(0);
    setCurrentCost(0);
    setTime(0);
    setStartTime(null);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${day}/${month}`;
  };

  return (
    <div className="bg-gray-100 rounded-lg p-4 w-[450px] h-[500px] shadow-md border-2 border-green-400 flex flex-col">
      <h2 className="text-2xl font-bold mb-1">Table {order}</h2>
      <div className="text-6xl font-bold my-1">{formatTime(time)}</div>
      {/* <div className="text-gray-600 text-sm mb-1">
        Rate: ${ratePerMinute.toFixed(2)}/min
      </div> */}
      <div className={`text-4xl font-bold mb-2 ${isRunning ? 'text-green-600' : 'text-gray-600'}`}>
        {isRunning ? `$${currentCost.toFixed(2)}` : `$${currentCost?.toFixed(2) || '0.00'}`}
      </div>
      <div className="flex gap-5 justify-center mb-2">
        <button 
          onClick={handleStart} 
          disabled={isRunning}
          className="px-5 py-1 bg-green-500 text-white rounded text-2xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-600"
        >
          Start
        </button>
        <button 
          onClick={handlePause} 
          disabled={!isRunning}
          className="px-5 py-1 bg-blue-500 text-white rounded text-2xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600"
        >
          Pause
        </button>
        <button 
          onClick={handleStop} 
          disabled={!isRunning && time === 0}
          className="px-5 py-1 bg-red-500 text-white rounded text-2xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-600"
        >
          Stop
        </button>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <h3 className="text-left font-bold text-sm mb-1">History</h3>
        <div className="flex-1 overflow-y-auto border border-gray-300 rounded p-2 bg-white">
          {history.map((record, index) => (
            <div key={index} className="py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-gray-600 text-sm">
                  {record.startDate}
                </div>
                <div className="text-green-600 font-semibold">
                Subtotal: ${record.cost.toFixed(2)}
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="text-sm">
                  {record.startTime} - {record.endTime}
                </div>
                <div className="text-sm text-gray-500">
                  Time: {record.duration}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Timer; 