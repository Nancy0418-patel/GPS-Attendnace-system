import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 24, 
  className = '', 
  message = 'Loading...' 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 size={size} className="animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;