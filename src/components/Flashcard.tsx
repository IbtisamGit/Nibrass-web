import React, { useState } from 'react';

interface FlashcardProps {
  frontText: string;
  backText: string;
}

const Flashcard: React.FC<FlashcardProps> = ({ frontText, backText }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="group w-full h-64 [perspective:1000px] cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Front Side */}
        <div className="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-md border border-gray-100 flex items-center justify-center p-8 text-center [backface-visibility:hidden]">
          <p className="text-xl font-medium text-gray-800 leading-relaxed">{frontText}</p>
        </div>

        {/* Back Side */}
        <div className="absolute inset-0 w-full h-full bg-indigo-600 text-white rounded-2xl shadow-md flex items-center justify-center p-8 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <p className="text-lg font-medium leading-relaxed">{backText}</p>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
