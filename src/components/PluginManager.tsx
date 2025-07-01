import React, { useState } from 'react';
import { Puzzle, Download, Settings, Play, Square, ChevronRight, Star } from 'lucide-react';

interface PluginManagerProps {
  installedPlugins: any[];
  onInstallPlugin: (plugin: any) => void;
  projectType: string;
}

export const PluginManager: React.FC<PluginManagerProps> = ({ installedPlugins, onInstallPlugin, projectType }) => {
  const [plugins, setPlugins] = useState(installedPlugins);

  const availablePlugins = [
    { 
      id: 1, 
      name: 'THREEDStorage', 
      description: '3D object management and rendering system', 
      version: '1.2.0', 
      downloads: '25.2k', 
      author: 'Virb.IO Team',
      category: '3D',
      recommended: ['game3d']
    },
    { 
      id: 2, 
      name: 'Advanced Syntax Highlighter', 
      description: 'Enhanced code highlighting with intelligent hints', 
      version: '2.1.4', 
      downloads: '18.7k', 
      author: 'Community',
      category: 'Editor',
      recommended: ['webapp']
    },
    { 
      id: 3, 
      name: 'Bug Hint Helper', 
      description: 'AI-powered bug detection and suggestions', 
      version: '1.0.8', 
      downloads: '15.2k', 
      author: 'DevTools Inc',
      category: 'Debug',
      recommended: ['game3d', 'game2d', 'webapp']
    },
    { 
      id: 4, 
      name: 'Performance Monitor', 
      description: 'Real-time performance analysis and optimization', 
      version: '0.9.3', 
      downloads: '8.7k', 
      author: 'OptimizePro',
      category: 'Performance',
      recommended: ['game3d', 'game2d']
    },
    { 
      id: 5, 
      name: 'Git Integration', 
      description: 'Version control integration with visual diff', 
      version: '3.1.0', 
      downloads: '22.1k', 
      author: 'VCS Solutions',
      category: 'Version Control',
      recommended: ['webapp']
    },
    { 
      id: 6, 
      name: 'API Designer', 
      description: 'Visual API endpoint designer and tester', 
      version: '1.4.2', 
      downloads: '5.3k', 
      author: 'APITools',
      category: 'Web',
      recommended: ['webapp']
    },
    { 
      id: 7, 
      name: 'UI Component Library', 
      description: 'Pre-built UI components for faster development', 
      version: '2.0.1', 
      downloads: '12.8k', 
      author: 'UIKit Pro',
      category: 'UI',
      recommended: ['webapp']
    },
    { 
      id: 8, 
      name: 'Animation Studio', 
      description: 'Advanced animation tools for 2D and 3D objects', 
      version: '1.3.5', 
      downloads: '9.4k', 
      author: 'AnimatePro',
      category: 'Animation',
      recommended: ['game2d', 'game3d']
    }
  ];

  const togglePlugin = (pluginId: number) => {
    setPlugins(plugins =>
      plugins.map(plugin =>
        plugin.id === pluginId ? { ...plugin, enabled: !plugin.enabled } : plugin
      )
    );
  };

  const installPlugin = (plugin: any) => {
    const newPlugin = { ...plugin, enabled: true };
    setPlugins(prev => [...prev, newPlugin]);
    onInstallPlugin(newPlugin);
  };

  const isInstalled = (pluginId: number) => {
    return plugins.some(p => p.id === pluginId);
  };

  const getRecommendedPlugins = () => {
    return availablePlugins.filter(plugin => 
      plugin.recommended.includes(projectType) && !isInstalled(plugin.id)
    );
  };

  const getOtherPlugins = () => {
    return availablePlugins.filter(plugin => 
      !plugin.recommended.includes(projectType) && !isInstalled(plugin.id)
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Plugins</h2>
        <button className="text-green-400 hover:text-green-300 text-sm">
          Browse Store
        </button>
      </div>

      {/* Installed Plugins */}
      {plugins.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
            <Puzzle className="w-5 h-5" />
            Installed ({plugins.length})
          </h3>
          
          <div className="space-y-3">
            {plugins.map((plugin) => (
              <div key={plugin.id} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{plugin.name}</h4>
                      <span className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300">
                        v{plugin.version}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${plugin.enabled ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{plugin.description}</p>
                    <p className="text-xs text-gray-500">by {plugin.author}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePlugin(plugin.id)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        plugin.enabled
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {plugin.enabled ? (
                        <>
                          <Square className="w-3 h-3 inline mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 inline mr-1" />
                          Enable
                        </>
                      )}
                    </button>
                    <button className="p-1 hover:bg-gray-600 rounded transition-colors">
                      <Settings className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Plugins */}
      {getRecommendedPlugins().length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Recommended for {projectType.charAt(0).toUpperCase() + projectType.slice(1)}
          </h3>
          
          <div className="space-y-3">
            {getRecommendedPlugins().map((plugin) => (
              <div key={plugin.id} className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-400/20 rounded-lg p-4 hover:bg-yellow-900/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{plugin.name}</h4>
                      <span className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300">
                        v{plugin.version}
                      </span>
                      <span className="px-2 py-0.5 bg-yellow-600 rounded text-xs text-white">
                        {plugin.category}
                      </span>
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{plugin.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>by {plugin.author}</span>
                      <span>{plugin.downloads} downloads</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => installPlugin(plugin)}
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Install
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Available Plugins */}
      {getOtherPlugins().length > 0 && (
        <div>
          <h3 className="text-md font-semibold text-white mb-3">
            Other Available Plugins
          </h3>
          
          <div className="space-y-3">
            {getOtherPlugins().map((plugin) => (
              <div key={plugin.id} className="bg-gray-700/30 border border-gray-600 rounded-lg p-4 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{plugin.name}</h4>
                      <span className="px-2 py-0.5 bg-gray-600 rounded text-xs text-gray-300">
                        v{plugin.version}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-600 rounded text-xs text-white">
                        {plugin.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{plugin.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>by {plugin.author}</span>
                      <span>{plugin.downloads} downloads</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => installPlugin(plugin)}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Install
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Plugin Spotlight */}
      <div className="mt-6 bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-4 border border-green-400/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-semibold text-sm">FEATURED</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">THREEDStorage Pro</h3>
        <p className="text-gray-300 text-sm mb-3">
          Advanced 3D object management with real-time rendering, physics simulation, and asset optimization. 
          Perfect for creating immersive 3D experiences in Virb.IO.
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Premium Plugin</span>
            <span>4.9★ (2.1k reviews)</span>
          </div>
          <button className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded font-medium text-sm transition-all">
            Learn More <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};