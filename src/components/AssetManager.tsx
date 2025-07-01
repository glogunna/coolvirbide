import React, { useState } from 'react';
import { Upload, Image, Volume2, Video, Download, Trash2, Plus, Search } from 'lucide-react';

export const AssetManager: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('images');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'images', name: 'Images', icon: <Image className="w-4 h-4" />, count: 12 },
    { id: 'sounds', name: 'Sounds', icon: <Volume2 className="w-4 h-4" />, count: 8 },
    { id: 'videos', name: 'Videos', icon: <Video className="w-4 h-4" />, count: 3 }
  ];

  const assets = {
    images: [
      { id: 1, name: 'PlayerIcon.png', size: '24KB', url: 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1' },
      { id: 2, name: 'Background.jpg', size: '156KB', url: 'https://images.pexels.com/photos/1117132/pexels-photo-1117132.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1' },
      { id: 3, name: 'Button.png', size: '8KB', url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1' }
    ],
    sounds: [
      { id: 1, name: 'BackgroundMusic.mp3', size: '2.1MB', duration: '3:24' },
      { id: 2, name: 'ButtonClick.wav', size: '45KB', duration: '0:01' },
      { id: 3, name: 'PlayerJump.ogg', size: '23KB', duration: '0:02' }
    ],
    videos: [
      { id: 1, name: 'Intro.mp4', size: '15.2MB', duration: '0:30' },
      { id: 2, name: 'Tutorial.webm', size: '8.7MB', duration: '1:45' }
    ]
  };

  const currentAssets = assets[activeCategory as keyof typeof assets] || [];

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Assets</h2>
        <button className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors">
          <Plus className="w-4 h-4" />
          Import
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-1 mb-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              activeCategory === category.id
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {category.icon}
            <span>{category.name}</span>
            <span className="bg-gray-600 px-1.5 py-0.5 rounded text-xs">{category.count}</span>
          </button>
        ))}
      </div>

      {/* Asset Grid */}
      <div className="space-y-2">
        {currentAssets.map((asset) => (
          <div key={asset.id} className="group flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors">
            <div className="flex-shrink-0">
              {activeCategory === 'images' && (
                <img
                  src={(asset as any).url}
                  alt={asset.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              {activeCategory === 'sounds' && (
                <div className="w-12 h-12 bg-yellow-400 rounded flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-black" />
                </div>
              )}
              {activeCategory === 'videos' && (
                <div className="w-12 h-12 bg-purple-400 rounded flex items-center justify-center">
                  <Video className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{asset.name}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <span>{asset.size}</span>
                {(asset as any).duration && <span>{(asset as any).duration}</span>}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-gray-600 rounded transition-colors" title="Download">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 hover:bg-red-600 rounded transition-colors" title="Delete">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Zone */}
      <div className="mt-6 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-400 mb-2">Drag and drop files here</p>
        <button className="text-green-400 hover:text-green-300 text-sm">or click to browse</button>
      </div>

      {/* Asset Reference Helper */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <h3 className="text-sm font-semibold text-green-400 mb-2">Reference in Code:</h3>
        <code className="text-xs text-gray-300">
          inst myImage = SharedStorage.Images.PlayerIcon
        </code>
      </div>
    </div>
  );
};