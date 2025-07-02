import React, { useState, useEffect } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { AssetManager } from './components/AssetManager';
import { PluginManager } from './components/PluginManager';
import { ProjectManager } from './components/ProjectManager';
import { LoadingScreen } from './components/LoadingScreen';
import { UIEditor } from './components/UIEditor';
import { GamePreview } from './components/GamePreview';
import { WorkspaceEditor } from './components/WorkspaceEditor';
import { Workspace2DEditor } from './components/Workspace2DEditor';
import { Infinity, Play, Square, Settings, Database, X, Plus, File, FolderOpen, Save } from 'lucide-react';

interface OpenTab {
  id: string;
  name: string;
  type: string;
  file: any;
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('explorer');
  const [project, setProject] = useState<any>(null);
  const [installedPlugins, setInstalledPlugins] = useState<any[]>([]);
  const [showFileMenu, setShowFileMenu] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-open workspace for game projects
    if (project && (project.type === 'game3d' || project.type === 'game2d')) {
      const displayMode = getWorkspaceDisplayMode();
      
      if (displayMode !== 'OFF') {
        let workspaceType = 'workspace';
        if (displayMode === 'THREED') {
          workspaceType = 'workspace3d';
        } else if (displayMode === 'TWOD') {
          workspaceType = 'workspace2d';
        }
        
        const workspaceTab: OpenTab = {
          id: 'workspace-tab',
          name: 'Workspace',
          type: workspaceType,
          file: { id: 'workspace', name: 'Workspace', type: workspaceType }
        };
        setOpenTabs([workspaceTab]);
        setActiveTabId('workspace-tab');
      }
    }
  }, [project]);

  const getWorkspaceDisplayMode = () => {
    if (!project) return 'OFF';
    
    // Find workspace config
    const workspaceConfig = project.services.workspace.objects.find((obj: any) => obj.type === 'config');
    if (workspaceConfig && workspaceConfig.content) {
      // Look for the DisplayMode setting in the config content
      const match = workspaceConfig.content.match(/workspace\.DisplayMode\s*=\s*"([^"]+)"/);
      if (match) {
        return match[1];
      }
    }
    
    // Default based on project type
    if (project.type === 'game3d') return 'THREED';
    if (project.type === 'game2d') return 'TWOD';
    return 'OFF';
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleFileSelect = (file: any) => {
    // Check if this is a workspace folder or workspace object
    if (file.id === 'workspace' || file.id === 'workspace-view' || file.type === 'workspace3d' || file.type === 'workspace2d') {
      const displayMode = getWorkspaceDisplayMode();
      
      let workspaceType = 'workspace';
      if (displayMode === 'THREED') {
        workspaceType = 'workspace3d';
      } else if (displayMode === 'TWOD') {
        workspaceType = 'workspace2d';
      }
      
      if (displayMode !== 'OFF') {
        const workspaceTab: OpenTab = {
          id: 'workspace-tab',
          name: 'Workspace',
          type: workspaceType,
          file: { id: 'workspace', name: 'Workspace', type: workspaceType }
        };
        
        // Remove existing workspace tab if any
        const filteredTabs = openTabs.filter(tab => tab.id !== 'workspace-tab');
        setOpenTabs([...filteredTabs, workspaceTab]);
        setActiveTabId('workspace-tab');
      }
      return;
    }
    
    const existingTab = openTabs.find(tab => tab.file.id === file.id);
    
    if (existingTab) {
      setActiveTabId(existingTab.id);
    } else {
      const newTab: OpenTab = {
        id: `tab-${Date.now()}`,
        name: file.name,
        type: file.type,
        file: file
      };
      setOpenTabs(prev => [...prev, newTab]);
      setActiveTabId(newTab.id);
    }
  };

  const closeTab = (tabId: string) => {
    const newTabs = openTabs.filter(tab => tab.id !== tabId);
    setOpenTabs(newTabs);
    
    if (activeTabId === tabId) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  const handleRunProject = () => {
    setIsRunning(!isRunning);
  };

  const handleCreateProject = (projectData: any) => {
    setProject(projectData);
    
    // Set default plugins based on project type
    let defaultPlugins: any[] = [];
    
    if (projectData.type === 'game3d') {
      defaultPlugins = [
        { id: 1, name: 'THREEDStorage', version: '1.2.0', enabled: true, author: 'Virb.IO Team', category: '3D' }
      ];
    } else if (projectData.type === 'webapp') {
      defaultPlugins = [
        { id: 2, name: 'Advanced Syntax Highlighter', version: '2.1.4', enabled: true, author: 'Community', category: 'Editor' }
      ];
    }
    
    setInstalledPlugins(defaultPlugins);
  };

  const handleInstallPlugin = (plugin: any) => {
    setInstalledPlugins(prev => [...prev, { ...plugin, enabled: true }]);
  };

  const handleNewProject = () => {
    setProject(null);
    setOpenTabs([]);
    setActiveTabId(null);
    setInstalledPlugins([]);
  };

  const handleSaveProject = () => {
    console.log('Saving project:', project.name);
    // Implement save functionality
  };

  if (!project) {
    return <ProjectManager onCreateProject={handleCreateProject} />;
  }

  const renderMainContent = () => {
    if (isRunning) {
      return <GamePreview project={project} />;
    }

    if (activeTabId) {
      const activeTab = openTabs.find(tab => tab.id === activeTabId);
      if (activeTab) {
        if (activeTab.type === 'ui') {
          return <UIEditor currentFile={activeTab.file} />;
        } else if (activeTab.type === 'workspace3d') {
          return <WorkspaceEditor project={project} />;
        } else if (activeTab.type === 'workspace2d') {
          return <Workspace2DEditor project={project} />;
        } else {
          return <CodeEditor currentFile={activeTab.file} />;
        }
      }
    }

    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">No File Selected</h3>
          <p>Select a file from the explorer to start editing</p>
        </div>
      </div>
    );
  };

  const getActiveTab = () => {
    return openTabs.find(tab => tab.id === activeTabId);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Infinity className="w-6 h-6 text-green-400" />
            <span className="text-xl font-bold text-green-400">Virb.IO</span>
          </div>
          <span className="text-gray-400">|</span>
          
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              className="px-3 py-1 hover:bg-gray-700 rounded transition-colors text-sm"
            >
              File
            </button>
            {showFileMenu && (
              <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-50 min-w-48">
                <button
                  onClick={handleNewProject}
                  className="w-full px-4 py-2 text-left hover:bg-gray-600 flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Project
                </button>
                <button
                  onClick={() => {/* Implement open */}}
                  className="w-full px-4 py-2 text-left hover:bg-gray-600 flex items-center gap-2 text-sm"
                >
                  <FolderOpen className="w-4 h-4" />
                  Open Project
                </button>
                <hr className="border-gray-600" />
                <button
                  onClick={handleSaveProject}
                  className="w-full px-4 py-2 text-left hover:bg-gray-600 flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Project
                </button>
              </div>
            )}
          </div>
          
          <span className="text-sm text-gray-300">{project.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunProject}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              isRunning 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isRunning ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isRunning ? 'Stop' : 'Run'}
          </button>
          <button className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Click outside to close file menu */}
      {showFileMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowFileMenu(false)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {[
              { id: 'explorer', label: 'Explorer', icon: '📁' },
              { id: 'assets', label: 'Assets', icon: '🎨' },
              { id: 'plugins', label: 'Plugins', icon: '🔌' },
              { id: 'database', label: 'Database', icon: <Database className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white border-b-2 border-green-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  {typeof tab.icon === 'string' ? (
                    <span>{tab.icon}</span>
                  ) : (
                    tab.icon
                  )}
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'explorer' && (
              <FileExplorer 
                onFileSelect={handleFileSelect} 
                currentFile={getActiveTab()?.file} 
                project={project}
                installedPlugins={installedPlugins}
              />
            )}
            {activeTab === 'assets' && <AssetManager />}
            {activeTab === 'plugins' && (
              <PluginManager 
                installedPlugins={installedPlugins}
                onInstallPlugin={handleInstallPlugin}
                projectType={project.type}
              />
            )}
            {activeTab === 'database' && (
              <div className="p-4">
                <div className="text-center text-green-400 mb-4">
                  <Database className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="font-semibold">Database Manager</h3>
                </div>
                <div className="space-y-2">
                  {project.services.replicatedFirst.databases.map((db: any) => (
                    <div key={db.id} className="p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-sm font-medium">{db.name}</span>
                      </div>
                      <p className="text-xs text-gray-400">Database connection</p>
                    </div>
                  ))}
                  <button className="w-full p-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors">
                    New Database
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          {openTabs.length > 0 && (
            <div className="bg-gray-800 border-b border-gray-700 flex items-center overflow-x-auto">
              {openTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-2 border-r border-gray-700 cursor-pointer min-w-0 ${
                    activeTabId === tab.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-750'
                  }`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className="truncate max-w-32">{tab.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-0.5 hover:bg-gray-600 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {renderMainContent()}
        </div>
      </div>

      {/* Status Bar */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-400">
            {getActiveTab() ? `${getActiveTab()?.name} • ${getActiveTab()?.type}` : 'No file selected'}
          </span>
          {isRunning && (
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Running</span>
            </div>
          )}
        </div>
        <div className="text-gray-400">
          Virb.IO v1.0.0
        </div>
      </footer>
    </div>
  );
}

export default App;