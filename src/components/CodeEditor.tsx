import React, { useState, useEffect } from 'react';
import { Save, Copy, Search, ZoomIn, ZoomOut, Settings, Play, Volume2, Image as ImageIcon } from 'lucide-react';

interface CodeEditorProps {
  currentFile: any;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ currentFile }) => {
  const [code, setCode] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (currentFile) {
      if (currentFile.content) {
        setCode(currentFile.content);
      } else {
        const sampleCode = getSampleCode(currentFile.type);
        setCode(sampleCode);
      }
    }
  }, [currentFile]);

  const getSampleCode = (fileType: string) => {
    switch (fileType) {
      case 'vscript':
        return `// Virb.IO Script (.vscript)
// This script runs on both client and server

inst player = Workspace.Player
inst playerController = ReplicatedStorage.Scripts.PlayerController

function onPlayerJoin(player) {
    print("Player joined: " + player.name)
    
    // Create UI for player
    inst mainUI = UIService.MainMenu
    mainUI.show(player)
    
    // Play welcome sound
    inst welcomeSound = SoundService.WelcomeSound
    welcomeSound.play()
}

function updatePlayerPosition(x, y, z) {
    player.position = { x: x, y: y, z: z }
    
    // Update database
    inst playerData = ReplicatedFirst.PlayerData
    playerData.updatePosition(player.id, x, y, z)
}

// Event listeners
game.onPlayerJoin(onPlayerJoin)
player.onMove(updatePlayerPosition)`;

      case 'vlscript':
        return `// Virb.IO Local Script (.vlscript)
// This script runs only on the client

inst inputService = game.InputService
inst camera = Workspace.Camera
inst ui = UIService.MainMenu

function handleKeyPress(key) {
    if (key == "W") {
        player.moveForward()
    } else if (key == "S") {
        player.moveBackward()
    } else if (key == "A") {
        player.moveLeft()
    } else if (key == "D") {
        player.moveRight()
    }
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

CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 0,
    position_z REAL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_stats (
    id INTEGER PRIMARY KEY,
    player_id INTEGER,
    score INTEGER DEFAULT 0,
    playtime INTEGER DEFAULT 0,
    last_login TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Functions available in Virb.IO
function getPlayer(playerId) {
    SELECT * FROM players WHERE id = playerId;
}

function updatePlayerPosition(playerId, x, y, z) {
    UPDATE players 
    SET position_x = x, position_y = y, position_z = z 
    WHERE id = playerId;
}

function addExperience(playerId, exp) {
    UPDATE players 
    SET experience = experience + exp 
    WHERE id = playerId;
}`;

      default:
        return '// Select a file to start editing';
    }
  };

  const handleSave = () => {
    console.log('Saving file:', currentFile?.name);
  };

  const highlightSyntax = (text: string) => {
    if (!currentFile) return text;

    return text
      .replace(/\b(inst|function|if|else|while|for|return|print|CREATE|TABLE|SELECT|UPDATE|INSERT|DELETE|FROM|WHERE)\b/g, '<span style="color: #60A5FA; font-weight: 600;">$1</span>')
      .replace(/\b(ReplicatedStorage|ServerStorage|Workspace|UIService|SoundService|MediaService|ReplicatedFirst|game|player)\b/g, '<span style="color: #10B981;">$1</span>')
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
            <span className={`px-2 py-1 rounded text-xs font-semibold ${
              currentFile.type === 'vscript' ? 'bg-green-600 text-white' :
              currentFile.type === 'vlscript' ? 'bg-red-600 text-white' :
              currentFile.type === 'vdata' ? 'bg-yellow-600 text-black' :
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
            className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded transition-colors"
          >
            <Save className="w-4 h-4" />
            Save
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
              onChange={(e) => setCode(e.target.value)}
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