const saveToCSV = (data, filename) => {
  const csvContent = data.map(row => Object.values(row).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const loadFromCSV = async (file) => {
  const text = await file.text();
  const rows = text.split('\n');
  return rows.filter(row => row.trim()).map(row => {
    const [timerId, startTime, duration, cost, timestamp] = row.split(',');
    return {
      timerId: parseInt(timerId),
      startTime,
      duration,
      cost: parseFloat(cost),
      timestamp: parseInt(timestamp)
    };
  });
};

export { saveToCSV, loadFromCSV }; 