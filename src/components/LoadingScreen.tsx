import React from 'react';
import { Infinity } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <Infinity className="w-24 h-24 text-green-400 mx-auto animate-pulse" />
          <div className="absolute inset-0 bg-green-400 blur-xl opacity-20 rounded-full"></div>
        </div>
        <h1 className="text-4xl font-bold text-green-400 mb-4">Virb.IO</h1>
        <p className="text-xl text-gray-300 mb-8">The Future of Game Development</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-sm text-gray-400 mt-4">Loading your workspace...</p>
      </div>
    </div>
  );
};