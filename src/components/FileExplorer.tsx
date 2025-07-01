import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Database, Volume2, Image, Box, Monitor, Plus, MoreHorizontal, AlertTriangle, Settings } from 'lucide-react';

interface FileExplorerProps {
  onFileSelect: (file: any) => void;
  currentFile: any;
  project: any;
  installedPlugins: any[];
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, currentFile, project, installedPlugins }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'workspace', 'replicatedStorage', 'serverStorage']));
  const [showWarning, setShowWarning] = useState<string | null>(null);

  const hasThreeDStorage = installedPlugins.some(plugin => plugin.name === 'THREEDStorage');

  const ScriptIcon: React.FC<{ type: string }> = ({ type }) => {
    const getColor = () => {
      switch (type) {
        case 'vscript': return 'bg-green-500';
        case 'vlscript': return 'bg-red-500';
        case 'vdata': return 'bg-yellow-500';
        case 'config': return 'bg-blue-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div className="relative">
        {type === 'config' ? <Settings className="w-4 h-4 text-gray-300" /> : <FileText className="w-4 h-4 text-gray-300" />}
        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${getColor()} rounded-sm`}></div>
      </div>
    );
  };

  const buildServicesFromProject = () => {
    const services = [
      {
        id: 'workspace',
        name: 'Workspace',
        icon: <Box className="w-4 h-4 text-indigo-400" />,
        type: project.type === 'game3d' ? 'workspace3d' : project.type === 'game2d' ? 'workspace2d' : 'workspace',
        children: project.services.workspace.objects.map((obj: any) => ({
          ...obj,
          icon: <Box className="w-4 h-4 text-indigo-400" />
        }))
      },
      {
        id: 'replicatedStorage',
        name: 'ReplicatedStorage',
        icon: <Folder className="w-4 h-4 text-blue-400" />,
        children: [
          ...(project.services.replicatedStorage.images.length > 0 ? [{
            id: 'rs-images',
            name: 'Images',
            icon: <Image className="w-4 h-4 text-purple-400" />,
            children: project.services.replicatedStorage.images.map((img: any) => ({
              ...img,
              icon: <Image className="w-4 h-4 text-purple-400" />
            }))
          }] : []),
          ...(project.services.replicatedStorage.sounds.length > 0 ? [{
            id: 'rs-sounds',
            name: 'Sounds',
            icon: <Volume2 className="w-4 h-4 text-yellow-400" />,
            children: project.services.replicatedStorage.sounds.map((sound: any) => ({
              ...sound,
              icon: <Volume2 className="w-4 h-4 text-yellow-400" />
            }))
          }] : []),
          ...(project.services.replicatedStorage.scripts.length > 0 ? [{
            id: 'rs-scripts',
            name: 'Scripts',
            icon: <Folder className="w-4 h-4 text-green-400" />,
            children: project.services.replicatedStorage.scripts.map((script: any) => ({
              ...script,
              icon: <ScriptIcon type={script.type} />
            }))
          }] : [])
        ].filter(Boolean)
      },
      {
        id: 'serverStorage',
        name: 'ServerStorage',
        icon: <Folder className="w-4 h-4 text-orange-400" />,
        children: [
          ...project.services.serverStorage.scripts.map((script: any) => ({
            ...script,
            icon: <ScriptIcon type={script.type} />
          })),
          ...project.services.serverStorage.character?.map((char: any) => ({
            ...char,
            icon: <Folder className="w-4 h-4 text-cyan-400" />,
            children: char.children?.map((child: any) => ({
              ...child,
              icon: child.type === 'ploid' ? <Box className="w-4 h-4 text-green-400" /> : 
                    child.type === '3dobject' ? <Box className="w-4 h-4 text-indigo-400" /> :
                    child.type === 'vlscript' ? <ScriptIcon type={child.type} /> :
                    child.type === 'config' ? <ScriptIcon type={child.type} /> :
                    <Image className="w-4 h-4 text-purple-400" />,
              children: child.children?.map((grandchild: any) => ({
                ...grandchild,
                icon: <ScriptIcon type={grandchild.type} />
              }))
            }))
          })) || []
        ]
      },
      ...(project.services.replicatedFirst.databases.length > 0 ? [{
        id: 'replicatedFirst',
        name: 'ReplicatedFirst',
        icon: <Database className="w-4 h-4 text-cyan-400" />,
        children: project.services.replicatedFirst.databases.map((db: any) => ({
          ...db,
          icon: <ScriptIcon type={db.type} />
        }))
      }] : []),
      {
        id: 'soundService',
        name: 'SoundService',
        icon: <Volume2 className="w-4 h-4 text-yellow-400" />,
        children: []
      },
      {
        id: 'mediaService',
        name: 'MediaService',
        icon: <Image className="w-4 h-4 text-purple-400" />,
        children: []
      },
      ...(project.services.uiService.screens.length > 0 ? [{
        id: 'uiService',
        name: 'UIService',
        icon: <Monitor className="w-4 h-4 text-pink-400" />,
        children: project.services.uiService.screens.map((screen: any) => ({
          ...screen,
          icon: <Monitor className="w-4 h-4 text-pink-400" />
        }))
      }] : [])
    ].filter(Boolean);

    // Add THREEDStorage if plugin is installed
    if (hasThreeDStorage) {
      services.push({
        id: 'threedStorage',
        name: 'THREEDStorage',
        icon: <Box className="w-4 h-4 text-purple-600" />,
        children: [
          { id: '3d1', name: 'Character.obj', type: '3dobject', icon: <Box className="w-4 h-4 text-purple-600" />, url: '/models/character.obj' },
          { id: '3d2', name: 'Terrain.obj', type: '3dobject', icon: <Box className="w-4 h-4 text-purple-600" />, url: '/models/terrain.obj' }
        ]
      });
    }

    return services;
  };

  const services = buildServicesFromProject();

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileClick = (item: any) => {
    if (item.warning && (item.type === 'vlscript' || item.type === 'vscript')) {
      setShowWarning(item.id);
      return;
    }
    
    if (item.type) {
      onFileSelect(item);
    }
  };

  const confirmEditWarningScript = (item: any) => {
    setShowWarning(null);
    onFileSelect(item);
  };

  const renderTreeItem = (item: any, depth = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = currentFile?.id === item.id;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 rounded transition-colors group ${
            isSelected ? 'bg-green-600 text-white' : 'text-gray-300'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleFolder(item.id);
            } else {
              handleFileClick(item);
            }
          }}
        >
          {hasChildren && (
            <button className="p-0.5 hover:bg-gray-600 rounded">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4"></div>}
          {item.icon}
          <span className="flex-1 truncate">{item.name}</span>
          {item.warning && (
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
          )}
          {!hasChildren && (
            <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-600 rounded transition-opacity">
              <MoreHorizontal className="w-3 h-3" />
            </button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children.map((child: any) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Explorer</h2>
        <button className="p-1 hover:bg-gray-700 rounded transition-colors">
          <Plus className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <div className="space-y-1">
        {services.map((service) => renderTreeItem(service))}
      </div>

      <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
        <h3 className="text-sm font-semibold text-green-400 mb-2">Virb.IO Reference</h3>
        <div className="text-xs text-gray-400 space-y-1">
          <div>• <span className="text-green-300">inst</span> variable = ReplicatedStorage.Images.Image1</div>
          <div>• <span className="text-red-300">.vlscript</span> - Client scripts</div>
          <div>• <span className="text-green-300">.vscript</span> - Server scripts</div>
          <div>• <span className="text-yellow-300">.vdata</span> - Database scripts</div>
          <div>• <span className="text-blue-300">Config</span> - Configuration object</div>
          <div>• <span className="text-blue-300">Ploid</span> - Character controller</div>
        </div>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Warning</h3>
            </div>
            <p className="text-gray-300 mb-4">
              This is a core player script that controls essential functionality like movement, 
              camera, or input handling. Modifying this script may cause player functionality 
              issues or break the game.
            </p>
            <p className="text-sm text-yellow-200 mb-6">
              Are you sure you want to edit this script?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const item = services
                    .flatMap(s => [s, ...(s.children || [])])
                    .flatMap(s => [s, ...(s.children || [])])
                    .flatMap(s => [s, ...(s.children || [])])
                    .flatMap(s => [s, ...(s.children || [])])
                    .find(i => i.id === showWarning);
                  if (item) confirmEditWarningScript(item);
                }}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors"
              >
                Edit Anyway
              </button>
              <button
                onClick={() => setShowWarning(null)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};