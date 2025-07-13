import React from 'react';

interface DayToggleProps {
  filter: 'all' | 'weekdays' | 'weekends';
  setFilter: (filter: 'all' | 'weekdays' | 'weekends') => void;
}

const DayToggle: React.FC<DayToggleProps> = ({ filter, setFilter }) => {
  const options: Array<'all' | 'weekdays' | 'weekends'> = ['all', 'weekdays', 'weekends'];
  
  return (
    <div className="flex gap-2 mb-3">
      {options.map(option => (
        <button
          key={option}
          className={`
            px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${filter === option 
              ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }
          `}
          onClick={() => setFilter(option)}
        >
          {option === 'all' ? 'All Days' : 
           option === 'weekdays' ? 'Weekdays' : 'Weekends'}
        </button>
      ))}
    </div>
  );
};

export default DayToggle;