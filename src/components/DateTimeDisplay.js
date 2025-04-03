import React, { useEffect, useState, useCallback, memo } from 'react';

const DateTimeDisplay = memo(() => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  
  // Memoize the formatting function to prevent recreation on every render
  const formatDateTime = useCallback((date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }, []);

  useEffect(() => {
    // Update every 5 seconds instead of every second
    const intervalId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Precompute the formatted time to avoid calculations in render
  const formattedTime = formatDateTime(currentDateTime);

  return (
    <div className="text-center mb-4">
      <h2 className="text-xl font-bold">{formattedTime}</h2>
    </div>
  );
});

export default DateTimeDisplay; 