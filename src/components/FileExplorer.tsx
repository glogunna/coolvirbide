import React, { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, Folder, FileText, Database, Volume2, Image, Box, Monitor, Plus, MoreHorizontal, AlertTriangle, Settings, Search, Edit2, Trash2, User } from 'lucide-react';

interface FileExplorerProps {
  onFileSelect: (file: any) => void;
  currentFile: any;
  project: any;
  installedPlugins: any[];
}

const ScriptIcon: React.FC<{ type: string }> = ({ type }) => {
  const getColor = () => {
    switch (type) {
      case 'basic': return 'bg-green-500';
      case 'home': return 'bg-red-500';
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

export const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect, currentFile, project, installedPlugins }) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'workspace', 'sharedStorage', 'privateStorage']));
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const [addMenuParent, setAddMenuParent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const hasThreeDStorage = installedPlugins.some(plugin => plugin.name === 'THREEDStorage');

  // Protected items that cannot be deleted or renamed
  const protectedItems = new Set([
    'workspace', 'sharedStorage', 'privateStorage', 'soundService', 
    'mediaService', 'uiService', 'threedStorage', 'dataVault',
    'workspace-view', 'baseplate'
  ]);

  const objectTypes = [
    { id: 'config', name: 'Configuration', icon: '⚙️', description: 'Configuration object for properties' },
    { id: 'model', name: 'Model', icon: '🏗️', description: 'Container for 3D objects' },
    { id: 'folder', name: 'Folder', icon: '📁', description: 'Organize objects in folders' },
    { id: 'vscript', name: 'Basic Script', icon: '📜', description: 'Server-side script (.vscript)' },
    { id: 'vlscript', name: 'Home Script', icon: '📋', description: 'Client-side script (.vlscript)' },
    { id: 'vdata', name: 'Data Script', icon: '🗄️', description: 'Database script (.vdata)' },
    { id: 'ploid', name: 'Ploid', icon: '🤖', description: 'Character controller' },
    { id: 'actor', name: 'Actor', icon: '👤', description: 'Interactive game actor with configurable role' },
    { id: 'part', name: 'Part', icon: '🧱', description: '3D part/block' },
    { id: 'sphere', name: 'Sphere', icon: '⚪', description: '3D sphere' },
    { id: 'cylinder', name: 'Cylinder', icon: '🥫', description: '3D cylinder' },
    { id: 'image', name: 'Image/Texture', icon: '🖼️', description: 'Image or texture file' },
    { id: 'sound', name: 'Sound', icon: '🔊', description: 'Audio file' },
    { id: 'video', name: 'Video', icon: '🎬', description: 'Video file' },
    { id: 'ui', name: 'UI Screen', icon: '📱', description: 'User interface screen' }
  ];

  const getFilteredObjectTypes = () => {
    return objectTypes.filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           type.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  function buildServicesFromProject() {
    const services = [
      {
        id: 'workspace',
        name: 'Workspace',
        icon: <Box className="w-4 h-4 text-indigo-400" />,
        type: project.type === 'game3d' ? 'workspace3d' : project.type === 'game2d' ? 'workspace2d' : 'workspace',
        children: [
          // Add workspace object back for easy access
          {
            id: 'workspace-view',
            name: 'Workspace',
            type: project.type === 'game3d' ? 'workspace3d' : project.type === 'game2d' ? 'workspace2d' : 'workspace',
            icon: <Box className="w-4 h-4 text-indigo-400" />
          },
          // CRITICAL FIX: Add ALL workspace objects directly here so they appear in the explorer AND game
          ...project.services.workspace.objects.map((obj: any) => ({
            ...obj,
            icon: obj.type === 'config' ? <ScriptIcon type={obj.type} /> : 
                  obj.type === 'actor' ? <User className="w-4 h-4 text-green-400" /> :
                  obj.type === 'part' ? <Box className="w-4 h-4 text-blue-400" /> :
                  obj.type === 'sphere' ? <Box className="w-4 h-4 text-purple-400" /> :
                  obj.type === 'cylinder' ? <Box className="w-4 h-4 text-yellow-400" /> :
                  obj.type === 'model' ? <Box className="w-4 h-4 text-orange-400" /> :
                  obj.type === 'folder' ? <Folder className="w-4 h-4 text-gray-400" /> :
                  <Box className="w-4 h-4 text-indigo-400" />,
            children: obj.children ? obj.children.map((child: any) => ({
              ...child,
              icon: child.type === 'config' ? <ScriptIcon type={child.type} /> :
                    child.type === 'vscript' ? <ScriptIcon type="basic" /> :
                    child.type === 'vlscript' ? <ScriptIcon type="home" /> :
                    child.type === 'vdata' ? <ScriptIcon type="vdata" /> :
                    <FileText className="w-4 h-4 text-gray-300" />,
              children: child.children || []
            })) : []
          }))
        ]
      },
      {
        id: 'sharedStorage',
        name: 'SharedStorage',
        icon: <Folder className="w-4 h-4 text-blue-400" />,
        children: [
          ...(project.services.replicatedStorage.images.length > 0 ? [{
            id: 'ss-images',
            name: 'Images',
            icon: <Image className="w-4 h-4 text-purple-400" />,
            children: project.services.replicatedStorage.images.map((img: any) => ({
              ...img,
              icon: <Image className="w-4 h-4 text-purple-400" />,
              children: img.children || []
            }))
          }] : []),
          ...(project.services.replicatedStorage.sounds.length > 0 ? [{
            id: 'ss-sounds',
            name: 'Sounds',
            icon: <Volume2 className="w-4 h-4 text-yellow-400" />,
            children: project.services.replicatedStorage.sounds.map((sound: any) => ({
              ...sound,
              icon: <Volume2 className="w-4 h-4 text-yellow-400" />,
              children: sound.children || []
            }))
          }] : []),
          ...(project.services.replicatedStorage.scripts.length > 0 ? [{
            id: 'ss-scripts',
            name: 'Scripts',
            icon: <Folder className="w-4 h-4 text-green-400" />,
            children: project.services.replicatedStorage.scripts.map((script: any) => ({
              ...script,
              // Keep original type but map display type for icons
              displayType: script.type === 'vscript' ? 'basic' : script.type === 'vlscript' ? 'home' : script.type,
              icon: <ScriptIcon type={script.type === 'vscript' ? 'basic' : script.type === 'vlscript' ? 'home' : script.type} />,
              children: script.children || []
            }))
          }] : [])
        ].filter(Boolean)
      },
      {
        id: 'privateStorage',
        name: 'PrivateStorage',
        icon: <Folder className="w-4 h-4 text-orange-400" />,
        children: [
          ...project.services.serverStorage.scripts.map((script: any) => ({
            ...script,
            // Keep original type but map display type for icons
            displayType: script.type === 'vscript' ? 'basic' : script.type === 'vlscript' ? 'home' : script.type,
            icon: <ScriptIcon type={script.type === 'vscript' ? 'basic' : script.type === 'vlscript' ? 'home' : script.type} />,
            children: script.children || []
          })),
          ...project.services.serverStorage.character?.map((char: any) => ({
            ...char,
            icon: <Folder className="w-4 h-4 text-cyan-400" />,
            children: char.children?.map((child: any) => ({
              ...child,
              // Keep original type but map display type for icons
              displayType: child.type === 'vlscript' ? 'home' : child.type,
              icon: child.type === 'ploid' ? <Box className="w-4 h-4 text-green-400" /> : 
                    child.type === '3dobject' ? <Box className="w-4 h-4 text-indigo-400" /> :
                    child.type === 'vlscript' ? <ScriptIcon type="home" /> :
                    child.type === 'config' ? <ScriptIcon type={child.type} /> :
                    <Image className="w-4 h-4 text-purple-400" />,
              children: child.children?.map((grandchild: any) => ({
                ...grandchild,
                // Keep original type but map display type for icons
                displayType: grandchild.type === 'vscript' ? 'basic' : grandchild.type === 'vlscript' ? 'home' : grandchild.type,
                icon: <ScriptIcon type={grandchild.type === 'vscript' ? 'basic' : grandchild.type === 'vlscript' ? 'home' : grandchild.type} />,
                children: grandchild.children || []
              })) || []
            })) || []
          })) || []
        ]
      },
      ...(project.services.replicatedFirst.databases.length > 0 ? [{
        id: 'dataVault',
        name: 'DataVault',
        icon: <Database className="w-4 h-4 text-cyan-400" />,
        children: project.services.replicatedFirst.databases.map((db: any) => ({
          ...db,
          icon: <ScriptIcon type={db.type} />,
          children: db.children || []
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
          icon: <Monitor className="w-4 h-4 text-pink-400" />,
          children: screen.children || []
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
          { id: '3d1', name: 'Character.obj', type: '3dobject', icon: <Box className="w-4 h-4 text-purple-600" />, url: '/models/character.obj', children: [] },
          { id: '3d2', name: 'Terrain.obj', type: '3dobject', icon: <Box className="w-4 h-4 text-purple-600" />, url: '/models/terrain.obj', children: [] }
        ]
      });
    }

    return services;
  };

  const [services, setServices] = useState(() => buildServicesFromProject());

  const addObjectToHierarchy = (type: string, parentPath: string[]) => {
    const newObject = {
      id: `${type}_${Date.now()}`,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      icon: getIconForType(type),
      children: [],
      content: getDefaultContent(type),
      ...(type === 'actor' && {
        position: { x: 0, y: 1, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      }),
      ...(['part', 'sphere', 'cylinder'].includes(type) && {
        position: { x: 0, y: 2, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        color: '#' + Math.floor(Math.random()*16777215).toString(16)
      })
    };

    // Add default config for Actor
    if (type === 'actor') {
      newObject.children = [{
        id: `config_${Date.now()}`,
        name: 'Config',
        type: 'config',
        icon: <ScriptIcon type="config" />,
        children: [],
        content: getActorConfigContent()
      }];
    }

    // Find parent and add the new object
    const updatedServices = [...services];
    let current: any = updatedServices;
    
    for (let i = 0; i < parentPath.length; i++) {
      const pathSegment = parentPath[i];
      if (i === 0) {
        current = current.find((service: any) => service.id === pathSegment);
      } else {
        current = current.children.find((child: any) => child.id === pathSegment);
      }
    }

    if (current) {
      if (!current.children) current.children = [];
      current.children.push(newObject);
      setServices(updatedServices);
      
      // CRITICAL: Update the project data so the workspace editor and game preview can see the new objects
      updateProjectData(updatedServices);
    }

    setShowAddMenu(false);
  };

  // CRITICAL: Function to sync changes back to project data
  const updateProjectData = (updatedServices: any[]) => {
    const workspaceService = updatedServices.find(service => service.id === 'workspace');
    if (workspaceService) {
      // Filter out the workspace-view item and update the project
      const workspaceObjects = workspaceService.children.filter((child: any) => child.id !== 'workspace-view');
      project.services.workspace.objects = workspaceObjects;
      console.log('[EXPLORER] Updated project workspace objects:', workspaceObjects);
    }
  };

  const getActorConfigContent = () => {
    return `// Actor Configuration
// This script configures the Actor's role and behavior

const actor = inst('script.Parent');

// Actor Role Configuration
actor.Role = "SpawnPoint";  // Options: "SpawnPoint", "NPC", "Collectible", "Trigger", "Enemy"

// Spawn Point Properties (when Role = "SpawnPoint")
actor.SpawnPoint = {
    IsDefault: true,        // Is this the default spawn point?
    Team: "All",           // Which team can spawn here? ("All", "Red", "Blue", etc.)
    RespawnTime: 0,        // Delay before respawn (seconds)
    MaxPlayers: 1          // Max players that can spawn here simultaneously
};

// Physical Properties
actor.Collision = false;     // Set to false so players can pass through
actor.Transparency = 0.5;     // Make it semi-transparent
actor.Color = "Green";        // Visual indicator color

// NPC Properties (when Role = "NPC")
actor.NPC = {
    Health: 100,
    WalkSpeed: 8,
    Dialogue: "Hello, welcome to the game!",
    Hostile: false
};

// Collectible Properties (when Role = "Collectible")
actor.Collectible = {
    Value: 10,             // Points/coins awarded
    RespawnTime: 30,       // Time to respawn after collection
    Sound: "CoinPickup"    // Sound to play when collected
};

// Trigger Properties (when Role = "Trigger")
actor.Trigger = {
    TriggerDistance: 5,    // Distance to activate
    OneTime: false,        // Can only be triggered once?
    Action: "OpenDoor"     // What happens when triggered
};

// Functions
actor.OnPlayerTouch = function(player) {
    if (actor.Role === "SpawnPoint") {
        // Handle spawn point logic
        console.log("Player " + player.Name + " touched spawn point");
    } else if (actor.Role === "Collectible") {
        // Handle collectible logic
        player.Score = player.Score + actor.Collectible.Value;
        actor.Visible = false;
        // Respawn after delay
        wait(actor.Collectible.RespawnTime);
        actor.Visible = true;
    } else if (actor.Role === "Trigger") {
        // Handle trigger logic
        console.log("Trigger activated by " + player.Name);
        // Execute trigger action
    }
};

actor.SetRole = function(newRole) {
    actor.Role = newRole;
    console.log("Actor role changed to: " + newRole);
};

actor.GetSpawnPosition = function() {
    if (actor.Role === "SpawnPoint") {
        return actor.Position;
    }
    return null;
};

// Events
actor.PlayerTouched = game.CreateEvent();
actor.RoleChanged = game.CreateEvent();

// Connect events
actor.OnTouch.Connect(actor.OnPlayerTouch);

console.log("Actor configured as: " + actor.Role);`;
  };

  const moveObject = (sourceItem: any, targetParentPath: string[]) => {
    const updatedServices = [...services];
    
    // Remove from source
    const removeFromParent = (items: any[], itemId: string): boolean => {
      for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId) {
          items.splice(i, 1);
          return true;
        }
        if (items[i].children && removeFromParent(items[i].children, itemId)) {
          return true;
        }
      }
      return false;
    };

    removeFromParent(updatedServices, sourceItem.id);

    // Add to target
    let targetParent: any = updatedServices;
    for (let i = 0; i < targetParentPath.length; i++) {
      const pathSegment = targetParentPath[i];
      if (i === 0) {
        targetParent = targetParent.find((service: any) => service.id === pathSegment);
      } else {
        targetParent = targetParent.children.find((child: any) => child.id === pathSegment);
      }
    }

    if (targetParent) {
      if (!targetParent.children) targetParent.children = [];
      targetParent.children.push(sourceItem);
      setServices(updatedServices);
      
      // Update project data
      updateProjectData(updatedServices);
    }
  };

  const getIconForType = (type: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'config': <ScriptIcon type="config" />,
      'model': <Box className="w-4 h-4 text-orange-400" />,
      'folder': <Folder className="w-4 h-4 text-gray-400" />,
      'vscript': <ScriptIcon type="basic" />,
      'vlscript': <ScriptIcon type="home" />,
      'vdata': <ScriptIcon type="vdata" />,
      'ploid': <Box className="w-4 h-4 text-green-400" />,
      'actor': <User className="w-4 h-4 text-green-400" />,
      'part': <Box className="w-4 h-4 text-blue-400" />,
      'sphere': <Box className="w-4 h-4 text-purple-400" />,
      'cylinder': <Box className="w-4 h-4 text-yellow-400" />,
      'image': <Image className="w-4 h-4 text-purple-400" />,
      'sound': <Volume2 className="w-4 h-4 text-yellow-400" />,
      'video': <Monitor className="w-4 h-4 text-red-400" />,
      'ui': <Monitor className="w-4 h-4 text-pink-400" />
    };
    return iconMap[type] || <FileText className="w-4 h-4 text-gray-400" />;
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case 'vscript':
        return `// Basic Script (Server)
console.log("Basic script loaded");

function onPlayerJoin(player) {
    console.log("Player joined: " + player.name);
}

game.onPlayerJoin(onPlayerJoin);`;
      case 'vlscript':
        return `// Home Script (Client)
console.log("Home script loaded");

const player = inst('game.Players.LocalPlayer');

function onKeyPress(key) {
    console.log("Key pressed: " + key);
}

game.InputService.onKeyPress(onKeyPress);`;
      case 'vdata':
        return `-- Database Script
CREATE TABLE IF NOT EXISTS data (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

function getData(id) {
    SELECT * FROM data WHERE id = id;
}`;
      case 'config':
        return `// Configuration
const parent = inst('script.Parent');

parent.Health = 100;
parent.MaxHealth = 100;
parent.Speed = 16;

console.log("Configuration loaded");`;
      case 'actor':
        return null; // Actor content is handled by its config
      default:
        return null;
    }
  };

  const deleteObject = (objectPath: string[]) => {
    const objectId = objectPath[objectPath.length - 1];
    
    // Check if object is protected
    if (protectedItems.has(objectId)) {
      return;
    }

    const updatedServices = [...services];
    let current: any = updatedServices;

    // Navigate to the object's parent
    for (let i = 0; i < objectPath.length - 1; i++) {
      const pathSegment = objectPath[i];
      if (i === 0) {
        current = current.find((service: any) => service.id === pathSegment);
      } else {
        current = current.children.find((child: any) => child.id === pathSegment);
      }
    }

    // Find the object in its parent's children
    if (current && current.children) {
      const lastSegment = objectPath[objectPath.length - 1];
      const objectIndex = current.children.findIndex((child: any) => child.id === lastSegment);
      if (objectIndex !== -1) {
        current.children.splice(objectIndex, 1);
        setServices(updatedServices);
        
        // Update project data
        updateProjectData(updatedServices);
      }
    }
  };

  const renameObject = (objectPath: string[], newName: string) => {
    const objectId = objectPath[objectPath.length - 1];
    
    // Check if object is protected
    if (protectedItems.has(objectId)) {
      return;
    }

    const updatedServices = [...services];
    let current: any = updatedServices;

    // Navigate to the object
    for (let i = 0; i < objectPath.length; i++) {
      const pathSegment = objectPath[i];
      if (i === 0) {
        current = current.find((service: any) => service.id === pathSegment);
      } else {
        current = current.children.find((child: any) => child.id === pathSegment);
      }
    }

    if (current) {
      current.name = newName;
      setServices(updatedServices);
      
      // Update project data
      updateProjectData(updatedServices);
    }
  };

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

  const handleAddButtonClick = (event: React.MouseEvent, item: any, path: string[]) => {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setAddMenuPosition({ x: rect.right + 10, y: rect.top });
    setAddMenuParent({ item, path });
    setShowAddMenu(true);
    setSearchTerm('');
  };

  const canAcceptDrop = (targetItem: any, sourceItem: any) => {
    // Can't drop on self or children
    if (targetItem.id === sourceItem.id) return false;
    
    // Check if target can have children (most objects can now accept children)
    const canHaveChildren = true; // Allow dropping on any object for maximum flexibility
    
    return canHaveChildren;
  };

  const handleDragStart = (e: React.DragEvent, item: any, path: string[]) => {
    // Don't allow dragging protected items
    if (protectedItems.has(item.id)) {
      e.preventDefault();
      return;
    }

    setDraggedItem({ item, path });
    e.dataTransfer.effectAllowed = 'move';
    dragCounter.current = 0;
  };

  const handleDragOver = (e: React.DragEvent, item: any, path: string[]) => {
    if (!draggedItem || !canAcceptDrop(item, draggedItem.item)) {
      return;
    }
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(item.id);
  };

  const handleDragEnter = (e: React.DragEvent, item: any) => {
    if (!draggedItem || !canAcceptDrop(item, draggedItem.item)) {
      return;
    }
    
    dragCounter.current++;
    setDragOverItem(item.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetItem: any, targetPath: string[]) => {
    e.preventDefault();
    
    if (!draggedItem || !canAcceptDrop(targetItem, draggedItem.item)) {
      return;
    }

    moveObject(draggedItem.item, targetPath);
    setDraggedItem(null);
    setDragOverItem(null);
    dragCounter.current = 0;
  };

  const renderTreeItem = (item: any, depth = 0, path: string[] = []) => {
    const currentPath = [...path, item.id];
    const isExpanded = expandedFolders.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = currentFile?.id === item.id;
    const isProtected = protectedItems.has(item.id);
    const isDragOver = dragOverItem === item.id;
    const canDrag = !isProtected;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-gray-700 rounded transition-colors group ${
            isSelected ? 'bg-green-600 text-white' : 'text-gray-300'
          } ${isDragOver ? 'bg-blue-600/50 border-2 border-blue-400' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          draggable={canDrag}
          onDragStart={(e) => handleDragStart(e, item, currentPath)}
          onDragOver={(e) => handleDragOver(e, item, currentPath)}
          onDragEnter={(e) => handleDragEnter(e, item)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item, currentPath)}
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
          
          {editingName === item.id && !isProtected ? (
            <input
              type="text"
              value={item.name}
              onChange={(e) => renameObject(currentPath, e.target.value)}
              onBlur={() => setEditingName(null)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setEditingName(null);
                if (e.key === 'Escape') setEditingName(null);
              }}
              className="flex-1 px-1 py-0.5 bg-gray-600 border border-gray-500 rounded text-white text-xs"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 truncate">{item.name}</span>
          )}
          
          {item.warning && (
            <AlertTriangle className="w-3 h-3 text-yellow-400" />
          )}
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Add button for ALL objects */}
            <button
              onClick={(e) => handleAddButtonClick(e, item, currentPath)}
              className="p-0.5 hover:bg-gray-600 rounded transition-colors"
              title="Add Object"
            >
              <Plus className="w-3 h-3 text-gray-400" />
            </button>
            
            {/* Rename button - only for non-protected items */}
            {!isProtected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingName(item.id);
                }}
                className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                title="Rename"
              >
                <Edit2 className="w-3 h-3 text-gray-400" />
              </button>
            )}
            
            {/* Delete button - only for non-protected items */}
            {!isProtected && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteObject(currentPath);
                }}
                className="p-0.5 hover:bg-red-600 rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-gray-400" />
              </button>
            )}
            
            {/* More options for protected items */}
            {isProtected && (
              <button className="p-0.5 hover:bg-gray-600 rounded transition-colors">
                <MoreHorizontal className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children.map((child: any) => renderTreeItem(child, depth + 1, currentPath))}
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
          <div>• <span className="text-green-300">inst</span> variable = SharedStorage.Images.Image1</div>
          <div>• <span className="text-red-300">.vlscript</span> - Home scripts (client-side)</div>
          <div>• <span className="text-green-300">.vscript</span> - Basic scripts (server-side)</div>
          <div>• <span className="text-yellow-300">.vdata</span> - Database scripts</div>
          <div>• <span className="text-blue-300">Config</span> - Configuration object</div>
          <div>• <span className="text-blue-300">Ploid</span> - Character controller</div>
          <div>• <span className="text-green-300">Actor</span> - Interactive game object</div>
          <div>• <span className="text-purple-300">Drag & Drop</span> - Reparent objects</div>
          <div>• <span className="text-cyan-300">✓ Workspace objects appear in game!</span></div>
        </div>
      </div>

      {/* Add Object Menu */}
      {showAddMenu && addMenuParent && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowAddMenu(false)}
          />
          <div 
            className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-4 w-80"
            style={{ 
              left: addMenuPosition.x, 
              top: addMenuPosition.y,
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          >
            <div className="mb-3">
              <h3 className="text-white font-semibold mb-2">
                Add to {addMenuParent.item.name}
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search objects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="space-y-1">
              {getFilteredObjectTypes().map((type) => (
                <button
                  key={type.id}
                  onClick={() => addObjectToHierarchy(type.id, addMenuParent.path)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-left"
                >
                  <span className="text-lg">{type.icon}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{type.name}</div>
                    <div className="text-gray-400 text-xs">{type.description}</div>
                  </div>
                </button>
              ))}
              {getFilteredObjectTypes().length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  No objects match your search
                </div>
              )}
            </div>
          </div>
        </>
      )}

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