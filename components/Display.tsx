import React from 'react';

interface DisplayProps {
  message: string;
  fontSize: number;
}

const Display: React.FC<DisplayProps> = ({ message, fontSize }) => {
  return (
    <div className="w-full bg-white border-2 border-gray-400 rounded-lg p-4 flex-shrink-0">
      <p 
        className="text-black break-words"
        style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.2}px` }}
      >
        {message}
        <span className="animate-pulse">|</span>
      </p>
    </div>
  );
};

export default Display;