import React, { useState, useEffect } from 'react';
import PasswordPopup from './PasswordPopup';
import { saveToCSV } from '../utils/fileHandler';

const RECORDS_PER_PAGE = 10;

const AdminPage = ({ onClose, rates, setRates }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rateConfigs, setRateConfigs] = useState(rates.map(rate => ({
    ...rate,
    scheduledRates: rate.scheduledRates || [
      { time: '00:00', rate: rate.rate },
      { time: '12:00', rate: rate.rate }
    ]
  })));
  const [allHistory, setAllHistory] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Date and time range state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Last trigger time state
  const [lastTriggerTime, setLastTriggerTime] = useState('');

  useEffect(() => {
    const mockHistory = JSON.parse(localStorage.getItem('timerHistory') || '[]');
    setAllHistory(mockHistory);
    const total = mockHistory.reduce((sum, record) => sum + record.cost, 0);
    setTotalEarnings(total);
  }, []);

  useEffect(() => {
    // Update total pages based on filtered history
    const filteredHistory = allHistory.filter(record => {
      const recordDate = new Date(record.startTime);
      const start = new Date(startDate + 'T' + startTime);
      const end = new Date(endDate + 'T' + endTime);
      return (!startDate || recordDate >= start) && (!endDate || recordDate <= end);
    });
    setTotalPages(Math.ceil(filteredHistory.length / RECORDS_PER_PAGE));
  }, [allHistory, startDate, endDate, startTime, endTime]);

  const handlePasswordSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleRateChange = (timerId, index, newTime, newRate) => {
    setRateConfigs(prev => prev.map(config => {
      if (config.id === timerId) {
        const newScheduledRates = [...config.scheduledRates];
        newScheduledRates[index] = { 
          time: newTime, 
          rate: newRate === '' ? '' : parseFloat(newRate) || 0 
        };

        // Sort the rates by time
        newScheduledRates.sort((a, b) => {
          const timeA = convertTimeToMinutes(a.time);
          const timeB = convertTimeToMinutes(b.time);
          return timeA - timeB;
        });

        return { ...config, scheduledRates: newScheduledRates };
      }
      return config;
    }));
  };

  const validateRates = () => {
    for (const config of rateConfigs) {
      const rates = config.scheduledRates;
      if (rates.some(r => isNaN(r.rate) || r.rate <= 0)) {
        alert('All rates must be positive numbers');
        return false;
      }

      // Convert times to minutes for easier comparison
      const time1 = convertTimeToMinutes(rates[0].time);
      const time2 = convertTimeToMinutes(rates[1].time);

      // Check if times are different
      if (time1 === time2) {
        alert('Time slots must be different for each rate');
        return false;
      }

      // Ensure time2 is greater than time1
      if (time1 > time2) {
        alert('Second time must be later than first time');
        return false;
      }
    }
    return true;
  };

  // Helper function to convert HH:mm time to minutes
  const convertTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleSave = () => {
    if (!validateRates()) return;

    const newRates = rateConfigs.map(config => ({
      id: config.id,
      rate: config.scheduledRates[0].rate,
      scheduledRates: [
        { time: config.scheduledRates[0].time, rate: config.scheduledRates[0].rate },
        { time: config.scheduledRates[1].time, rate: config.scheduledRates[1].rate }
      ]
    }));

    setRates(newRates);
    localStorage.setItem('timerRates', JSON.stringify(newRates));
    
/*     // Save to CSV
    const configData = newRates.map(rate => ({
      id: rate.id,
      rate: rate.rate,
      scheduledRates: JSON.stringify(rate.scheduledRates)
    }));
    saveToCSV(configData, 'timer_config.csv'); */
    
    onClose();
  };

  const getCurrentPageRecords = () => {
    const filteredHistory = allHistory.filter(record => {
      const recordDate = new Date(record.startTime);
      const start = new Date(startDate + 'T' + startTime);
      const end = new Date(endDate + 'T' + endTime);
      return (!startDate || recordDate >= start) && (!endDate || recordDate <= end);
    });

    // Sort filtered history in descending order by timestamp
    filteredHistory.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    const startIndex = (currentPage - 1) * RECORDS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + RECORDS_PER_PAGE);
  };

  const handleExportHistory = () => {
    const history = JSON.parse(localStorage.getItem('timerHistory') || '[]');
    saveToCSV(history, 'timer_records.csv');
  };

  const handleExportConfig = () => {
    const configData = rates.map(rate => ({
      id: rate.id,
      rate: rate.rate,
      scheduledRates: JSON.stringify(rate.scheduledRates)
    }));
    saveToCSV(configData, 'timer_config.csv');
  };

  // Filter history based on date and time range
  const filteredHistory = allHistory.filter(record => {
    const recordDate = new Date(record.startTime);
    const start = new Date(startDate + 'T' + startTime);
    const end = new Date(endDate + 'T' + endTime);
    return (!startDate || recordDate >= start) && (!endDate || recordDate <= end);
  });

  const handleClearLocalStorage = () => {
    // Only clear timer history
    localStorage.removeItem('timerHistory');
    setAllHistory([]);
    setTotalEarnings(0);
    setLastTriggerTime(new Date().toLocaleString());
  };

  if (!isAuthenticated) {
    return <PasswordPopup onSuccess={handlePasswordSuccess} onCancel={onClose} />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex gap-2">
{/*           <button 
            onClick={handleExportConfig}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export Config
          </button> */}
          <button 
            onClick={handleExportHistory}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Export History
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Rate Configuration</h2>
        {rateConfigs.map((config) => (
          <div key={config.id} className="mb-6 p-4 border rounded">
            <h3 className="font-bold mb-2">Table #{config.id}</h3>
            {config.scheduledRates.map((scheduled, index) => (
              <div key={index} className="flex gap-4 mb-2">
                <div className="flex items-center">
                  <span className="mr-2">Start Time {index + 1}:</span>
                  <input
                    type="time"
                    value={scheduled.time}
                    onChange={(e) => handleRateChange(config.id, index, e.target.value, scheduled.rate)}
                    className="border rounded px-2 py-1"
                  />
                </div>
                <div className="flex items-center">
                  <span className="mr-2">Rate:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={scheduled.rate}
                    onChange={(e) => handleRateChange(config.id, index, scheduled.time, e.target.value)}
                    className="border rounded px-2 py-1 w-24"
                  />
                  <span className="ml-2">/minute</span>
                </div>
              </div>
            ))}
          </div>
        ))}
        <button 
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">History</h2>
        <div className="mb-4">
        <div className="flex gap-4">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="border rounded px-2 py-1"
          />
          <input 
            type="time" 
            value={startTime} 
            onChange={(e) => setStartTime(e.target.value)} 
            className="border rounded px-2 py-1"
          />
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="border rounded px-2 py-1"
          />
          <input 
            type="time" 
            value={endTime} 
            onChange={(e) => setEndTime(e.target.value)} 
            className="border rounded px-2 py-1"
          />
        </div>
        </div>
        <div className="mb-4 text-lg font-bold text-green-600">
          Total Earnings: ${totalEarnings.toFixed(2)}
        </div>
        <div className="border rounded">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2">Table</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Start Time</th>
                <th className="px-4 py-2">End Time</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {getCurrentPageRecords().map((record, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2 text-center">#{record.timerId}</td>
                  <td className="px-4 py-2 text-center">{record.startDate}</td>
                  <td className="px-4 py-2 text-center">{record.startTime}</td>
                  <td className="px-4 py-2 text-center">{record.endTime}</td>
                  <td className="px-4 py-2 text-center">{record.duration}</td>
                  <td className="px-4 py-2 text-center">${record.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 rounded disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            <span className="px-4 py-1">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 rounded disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Clear Local Storage Button */}
      <div className="mt-4">
        <button 
          onClick={handleClearLocalStorage}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear History
        </button>
        {lastTriggerTime && (
          <div className="mt-2 text-sm text-gray-600">
            Last Trigger Time: {lastTriggerTime}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage; 