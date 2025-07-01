import React, { useState, useEffect, useCallback } from 'react';
import { Save, Copy, Search, ZoomIn, ZoomOut, Settings, Play, Volume2, Image as ImageIcon } from 'lucide-react';

interface CodeEditorProps {
  currentFile: any;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ currentFile }) => {
  const [code, setCode] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save function
  const autoSave = useCallback(() => {
    if (currentFile && hasUnsavedChanges) {
      currentFile.content = code;
      setHasUnsavedChanges(false);
      console.log('Auto-saved:', currentFile.name);
    }
  }, [currentFile, code, hasUnsavedChanges]);

  // Auto-save every 2 seconds when there are changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timer = setTimeout(autoSave, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, autoSave]);

  useEffect(() => {
    if (currentFile) {
      if (currentFile.content) {
        setCode(currentFile.content);
      } else {
        const sampleCode = getSampleCode(currentFile.type);
        setCode(sampleCode);
        // Set initial content
        currentFile.content = sampleCode;
      }
      setHasUnsavedChanges(false);
    }
  }, [currentFile]);

  const getSampleCode = (fileType: string) => {
    switch (fileType) {
      case 'vscript':
        return `// Virb.IO Script (.vscript)
// This script runs on both client and server

inst gameManager = ReplicatedStorage.Scripts.GameManager

function onServerStart() {
    print("Server starting...")
    gameManager.initGame()
}

function onPlayerJoin(player) {
    print("Player joined: " + player.name)
    
    // Setup player data
    inst playerData = ReplicatedFirst.PlayerData
    playerData.createPlayer(player.id, player.name)
}

// Event listeners
game.onServerStart(onServerStart)
game.onPlayerJoin(onPlayerJoin)`;

      case 'vlscript':
        return `// Virb.IO Local Script (.vlscript)
// This script runs only on the client

inst inputService = game.InputService
inst camera = Workspace.Camera
inst ui = UIService.MainMenu

function handleKeyPress(key) {
    if key == "W" then
        player.moveForward()
    elseif key == "S" then
        player.moveBackward()
    elseif key == "A" then
        player.moveLeft()
    elseif key == "D" then
        player.moveRight()
    end
}

function updateUI() {
    inst healthBar = ui.HealthBar
    healthBar.value = player.health
    
    inst scoreText = ui.ScoreText
    scoreText.text = "Score: " + player.score
}

// Bind events
inputService.onKeyPress(handleKeyPress)
game.onHeartbeat(updateUI)

// Initialize client
print("Client script loaded!")`;

      case 'vdata':
        return `-- Virb.IO Database Script (.vdata)
-- SQL-like syntax for database operations

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_data (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    data_key TEXT NOT NULL,
    data_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Functions available in Virb.IO
function createUser(userId, username, email) {
    INSERT INTO users (id, username, email) VALUES (userId, username, email);
}

function getUserData(userId, key) {
    SELECT data_value FROM app_data WHERE user_id = userId AND data_key = key;
}

function setUserData(userId, key, value) {
    INSERT OR REPLACE INTO app_data (user_id, data_key, data_value) 
    VALUES (userId, key, value);
}`;

      case 'config':
        return `-- Configuration Script
-- This script configures object properties and behavior

inst parent = script.Parent

-- Configuration Properties
parent.MaxHealth = 100
parent.Health = 100
parent.WalkSpeed = 16
parent.JumpPower = 50

-- Custom Functions
function parent.TakeDamage(amount)
    parent.Health = math.max(0, parent.Health - amount)
    if parent.Health <= 0 then
        parent.OnDestroyed:Fire()
    end
    parent.HealthChanged:Fire(parent.Health, parent.MaxHealth)
end

function parent.Heal(amount)
    parent.Health = math.min(parent.MaxHealth, parent.Health + amount)
    parent.HealthChanged:Fire(parent.Health, parent.MaxHealth)
end

-- Events
parent.HealthChanged = game.CreateEvent()
parent.OnDestroyed = game.CreateEvent()

print("Configuration loaded successfully")`;

      default:
        return '// Select a file to start editing';
    }
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    autoSave();
  };

  const highlightSyntax = (text: string) => {
    if (!currentFile) return text;

    return text
      .replace(/\b(inst|function|if|else|while|for|return|print|CREATE|TABLE|SELECT|UPDATE|INSERT|DELETE|FROM|WHERE)\b/g, '<span style="color: #60A5FA; font-weight: 600;">$1</span>')
      .replace(/\b(ReplicatedStorage|ServerStorage|Workspace|UIService|SoundService|MediaService|ReplicatedFirst|game|player|script|Parent)\b/g, '<span style="color: #10B981;">$1</span>')
      .replace(/"([^"]*)"/g, '<span style="color: #FCD34D;">"$1"</span>')
      .replace(/\/\/.*$/gm, '<span style="color: #6B7280;">$&</span>')
      .replace(/--.*$/gm, '<span style="color: #6B7280;">$&</span>')
      .replace(/\b(\d+)\b/g, '<span style="color: #F472B6;">$1</span>');
  };

  const renderMediaPreview = () => {
    if (!currentFile) return null;

    if (currentFile.type === 'image') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
          <div className="text-center">
            <img 
              src={currentFile.url} 
              alt={currentFile.name}
              className="max-w-full max-h-96 rounded-lg shadow-lg mb-4"
            />
            <h3 className="text-xl font-semibold text-white mb-2">{currentFile.name}</h3>
            <div className="text-gray-400 space-y-1">
              <p>Type: Image</p>
              <p>Reference: ReplicatedStorage.Images.{currentFile.name.split('.')[0]}</p>
            </div>
          </div>
        </div>
      );
    }

    if (currentFile.type === 'sound') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
          <div className="text-center">
            <div className="w-32 h-32 bg-yellow-400 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Volume2 className="w-16 h-16 text-black" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{currentFile.name}</h3>
            <div className="text-gray-400 space-y-1 mb-4">
              <p>Type: Audio</p>
              {currentFile.duration && <p>Duration: {currentFile.duration}</p>}
              <p>Reference: ReplicatedStorage.Sounds.{currentFile.name.split('.')[0]}</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors mx-auto">
              <Play className="w-4 h-4" />
              Play Audio
            </button>
          </div>
        </div>
      );
    }

    if (currentFile.type === '3dobject') {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
          <div className="text-center">
            <div className="w-64 h-64 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <div className="text-white text-6xl">🎲</div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">{currentFile.name}</h3>
            <div className="text-gray-400 space-y-1 mb-4">
              <p>Type: 3D Object</p>
              <p>Format: OBJ</p>
              <p>Reference: THREEDStorage.{currentFile.name.split('.')[0]}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                3D Preview
              </button>
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors">
                Properties
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (!currentFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900">
        <div className="text-center text-gray-400">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">No File Selected</h3>
          <p>Select a file from the explorer to start editing</p>
          <div className="mt-6 p-4 bg-gray-800 rounded-lg max-w-md">
            <h4 className="text-green-400 font-semibold mb-2">Virb.IO Quick Tips:</h4>
            <ul className="text-sm text-left space-y-1">
              <li>• Use <code className="text-green-300">inst</code> for variables</li>
              <li>• Reference assets: <code className="text-blue-300">ReplicatedStorage.Images.Icon</code></li>
              <li>• <code className="text-red-300">.vlscript</code> for client-side code</li>
              <li>• <code className="text-green-300">.vscript</code> for server-side code</li>
              <li>• <code className="text-yellow-300">.vdata</code> for databases</li>
              <li>• <code className="text-blue-300">Config</code> for object configuration</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Show media preview for non-code files
  if (['image', 'sound', '3dobject'].includes(currentFile.type)) {
    return renderMediaPreview();
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Editor Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {currentFile.icon}
            <span className="font-medium">{currentFile.name}</span>
            {hasUnsavedChanges && <span className="text-yellow-400" title="Auto-saving...">●</span>}
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              currentFile.type === 'vscript' ? 'bg-green-600 text-white' :
              currentFile.type === 'vlscript' ? 'bg-red-600 text-white' :
              currentFile.type === 'vdata' ? 'bg-yellow-600 text-black' :
              currentFile.type === 'config' ? 'bg-blue-600 text-white' :
              'bg-gray-600 text-white'
            }`}>
              {currentFile.type?.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFontSize(Math.max(10, fontSize - 1))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Decrease font size"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFontSize(Math.min(24, fontSize + 1))}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Increase font size"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1 bg-gray-600 text-gray-400 rounded transition-colors"
            title="Auto-save enabled"
          >
            <Save className="w-4 h-4" />
            Auto-save
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
          <input
            type="text"
            placeholder="Search in file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
          />
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Line Numbers */}
          <div className="bg-gray-800 px-3 py-4 text-right text-gray-500 text-sm select-none min-w-[50px]" style={{ fontSize: `${fontSize}px` }}>
            {code.split('\n').map((_, index) => (
              <div key={index} className="leading-6 h-6">
                {index + 1}
              </div>
            ))}
          </div>
          
          {/* Code Content */}
          <div className="flex-1 relative">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full bg-transparent text-white font-mono resize-none focus:outline-none leading-6 p-4 absolute inset-0 z-10"
              style={{ fontSize: `${fontSize}px` }}
              spellCheck={false}
            />
            <div 
              className="w-full h-full font-mono leading-6 p-4 pointer-events-none whitespace-pre-wrap break-words"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: highlightSyntax(code) }}
            />
          </div>
        </div>
      </div>

      {/* Syntax Help Panel */}
      <div className="bg-gray-800 border-t border-gray-700 p-3">
        <details className="text-sm">
          <summary className="cursor-pointer text-green-400 font-medium">Virb.IO Syntax Help</summary>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <h4 className="text-white font-semibold mb-1">Variables & References</h4>
              <code className="text-green-300">inst player = Workspace.Player</code><br/>
              <code className="text-blue-300">ReplicatedStorage.Images.Icon</code>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Functions</h4>
              <code className="text-purple-300">function playerJoin(player)</code><br/>
              <code className="text-yellow-300">game.onPlayerJoin(playerJoin)</code>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Services</h4>
              <code className="text-cyan-300">UIService.MainMenu.show()</code><br/>
              <code className="text-orange-300">SoundService.play("sound")</code>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};