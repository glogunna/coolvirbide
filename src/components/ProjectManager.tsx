import React, { useState } from 'react';
import { Infinity, Plus, Folder, Globe, Gamepad2, Smartphone, AlertTriangle, FileText } from 'lucide-react';

interface ProjectManagerProps {
  onCreateProject: (project: any) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ onCreateProject }) => {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('game3d');
  const [isCreating, setIsCreating] = useState(false);

  const projectTypes = [
    {
      id: 'game3d',
      name: '3D Game',
      description: 'Create immersive 3D experiences with physics',
      icon: <Gamepad2 className="w-8 h-8" />,
      color: 'text-purple-400'
    },
    {
      id: 'game2d',
      name: '2D Game',
      description: 'Build classic 2D games with sprites',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'text-blue-400'
    },
    {
      id: 'webapp',
      name: 'Web Application',
      description: 'Full-stack web applications with backend',
      icon: <Globe className="w-8 h-8" />,
      color: 'text-green-400'
    },
    {
      id: 'blank',
      name: 'Blank Project',
      description: 'Start with a clean slate - no templates',
      icon: <FileText className="w-8 h-8" />,
      color: 'text-gray-400'
    }
  ];

  const getProjectTemplate = (type: string) => {
    const baseServices = {
      replicatedStorage: {
        images: type === 'game2d' ? [
          { id: 'sprite1', name: 'PlayerSprite.png', type: 'image', url: 'https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1' }
        ] : type === 'game3d' ? [
          { id: 'texture1', name: 'WoodTexture.jpg', type: 'image', url: 'https://images.pexels.com/photos/129731/pexels-photo-129731.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1' }
        ] : [],
        sounds: type.includes('game') ? [
          { id: 'bgm1', name: 'BackgroundMusic.mp3', type: 'sound', duration: '3:24' }
        ] : [],
        scripts: type !== 'blank' ? [
          { id: 'gameManager', name: type === 'webapp' ? 'AppManager.vscript' : 'GameManager.vscript', type: 'vscript', content: getTemplateScript(type, 'gameManager') }
        ] : []
      },
      serverStorage: {
        scripts: type !== 'blank' ? [
          { id: 'serverInit', name: 'ServerInit.vscript', type: 'vscript', content: getTemplateScript(type, 'serverInit') }
        ] : [],
        character: type.includes('game') ? [
          { 
            id: 'character1', 
            name: 'Character1', 
            type: 'folder', 
            children: [
              { 
                id: 'playerModel', 
                name: 'PlayerModel.obj', 
                type: '3dobject', 
                url: '/models/character.obj',
                description: 'Red cube character model'
              },
              {
                id: 'ploid',
                name: 'Ploid',
                type: 'ploid',
                children: [
                  {
                    id: 'ploidConfig',
                    name: 'Config',
                    type: 'config',
                    content: getTemplateScript(type, 'ploidConfig')
                  }
                ]
              },
              {
                id: 'inputScript',
                name: 'InputHandler.vlscript',
                type: 'vlscript',
                content: getTemplateScript(type, 'inputHandler'),
                warning: true
              },
              {
                id: 'cameraScript',
                name: 'CameraController.vlscript',
                type: 'vlscript',
                content: getTemplateScript(type, 'cameraController'),
                warning: true
              },
              {
                id: 'movementScript',
                name: 'MovementController.vlscript',
                type: 'vlscript',
                content: getTemplateScript(type, 'movementController'),
                warning: true
              }
            ]
          }
        ] : []
      },
      replicatedFirst: {
        databases: type === 'webapp' ? [
          { id: 'appData', name: 'AppData.vdata', type: 'vdata', content: getTemplateScript(type, 'database') }
        ] : type.includes('game') ? [
          { id: 'playerData', name: 'PlayerData.vdata', type: 'vdata', content: getTemplateScript(type, 'database') }
        ] : []
      },
      workspace: {
        objects: type === 'game3d' ? [
          { id: 'baseplate', name: 'Baseplate', type: '3dobject', url: '/models/baseplate.obj' },
          {
            id: 'workspaceConfig',
            name: 'Config',
            type: 'config',
            content: getWorkspaceConfig('THREED')
          }
        ] : type === 'game2d' ? [
          { id: 'ground', name: 'Ground', type: 'sprite', url: '/sprites/ground.png' },
          {
            id: 'workspaceConfig',
            name: 'Config',
            type: 'config',
            content: getWorkspaceConfig('TWOD')
          }
        ] : type === 'webapp' ? [
          {
            id: 'workspaceConfig',
            name: 'Config',
            type: 'config',
            content: getWorkspaceConfig('OFF')
          }
        ] : [
          {
            id: 'workspaceConfig',
            name: 'Config',
            type: 'config',
            content: getWorkspaceConfig('OFF')
          }
        ]
      },
      uiService: {
        screens: type === 'webapp' ? [
          { id: 'mainApp', name: 'MainApp', type: 'ui', content: getTemplateUI(type) }
        ] : type.includes('game') ? [
          { id: 'mainMenu', name: 'MainMenu', type: 'ui', content: getTemplateUI(type) }
        ] : []
      }
    };

    return baseServices;
  };

  const getWorkspaceConfig = (mode: string) => {
    return `// Workspace Configuration
// This script configures the workspace display mode

const workspace = inst('script.Parent');

// Workspace Display Mode
// THREED: 3D workspace with 3D objects and camera
// TWOD: 2D workspace with 2D sprites and top-down view  
// OFF: No workspace display (for web applications)
workspace.DisplayMode = "${mode}";

// Workspace Properties
workspace.Name = "Workspace";
workspace.Enabled = ${mode !== 'OFF' ? 'true' : 'false'};

// Camera Settings (for 3D and 2D modes)
if (workspace.DisplayMode === "THREED") {
    workspace.Camera.Type = "Perspective";
    workspace.Camera.Position = { x: 10, y: 10, z: 10 };
    workspace.Camera.LookAt = { x: 0, y: 0, z: 0 };
    workspace.Physics.Enabled = true;
    workspace.Physics.Gravity = { x: 0, y: -50, z: 0 };
} else if (workspace.DisplayMode === "TWOD") {
    workspace.Camera.Type = "Orthographic";
    workspace.Camera.Position = { x: 0, y: 0, z: 10 };
    workspace.Camera.LookAt = { x: 0, y: 0, z: 0 };
    workspace.Physics.Enabled = true;
    workspace.Physics.Gravity = { x: 0, y: -50, z: 0 };
} else {
    workspace.Camera.Enabled = false;
    workspace.Physics.Enabled = false;
}

console.log("Workspace configured for " + workspace.DisplayMode + " mode");`;
  };

  const getTemplateScript = (projectType: string, scriptType: string) => {
    switch (scriptType) {
      case 'gameManager':
        if (projectType === 'webapp') {
          return `// Web Application Manager
const apiService = inst('game.APIService');
const database = inst('DataVault.AppData');

function initApp() {
    console.log("Initializing Web Application...");
    
    // Setup API endpoints
    apiService.createEndpoint("/api/users", handleUsers);
    apiService.createEndpoint("/api/data", handleData);
    
    // Connect to database
    database.connect();
    
    // Initialize UI
    const mainUI = inst('UIService.MainApp');
    mainUI.show();
}

function handleUsers(request) {
    // Handle user requests
    return { status: "success", users: database.getUsers() };
}

function handleData(request) {
    // Handle data requests
    return { status: "success", data: database.getData() };
}

game.onStart(initApp);`;
        } else if (projectType === 'game3d') {
          return `// 3D Game Manager
const camera = inst('Workspace.Camera');
const baseplate = inst('Workspace.Baseplate');

function initGame() {
    console.log("Initializing 3D Game...");
    
    // Setup 3D environment
    camera.position = { x: 0, y: 10, z: 20 };
    camera.lookAt({ x: 0, y: 0, z: 0 });
    
    // Initialize physics
    baseplate.enableCollision(true);
    
    // Setup lighting
    const lighting = inst('game.Lighting');
    lighting.ambient = 0.6;
    lighting.directional = 0.8;
}

game.onStart(initGame);`;
        } else if (projectType === 'game2d') {
          return `// 2D Game Manager
const ground = inst('Workspace.Ground');

function initGame() {
    console.log("Initializing 2D Game...");
    
    // Setup 2D physics
    ground.enableCollision2D(true);
    
    // Setup camera
    const camera = inst('Workspace.Camera');
    camera.mode = "2D";
}

game.onStart(initGame);`;
        }
        break;
      case 'serverInit':
        if (projectType === 'webapp') {
          return `// Server Initialization
const appManager = inst('SharedStorage.Scripts.AppManager');

function onServerStart() {
    console.log("Server starting...");
    appManager.initApp();
}

function onUserConnect(user) {
    console.log("User connected: " + user.name);
    
    // Setup user data
    const appData = inst('DataVault.AppData');
    appData.createUser(user.id, user.name);
}

game.onServerStart(onServerStart);
game.onUserConnect(onUserConnect);`;
        } else {
          return `// Server Initialization
const gameManager = inst('SharedStorage.Scripts.GameManager');

function onServerStart() {
    console.log("Server starting...");
    gameManager.initGame();
}

function onPlayerJoin(player) {
    console.log("Player joined: " + player.name);
    
    // Setup player data
    const playerData = inst('DataVault.PlayerData');
    playerData.createPlayer(player.id, player.name);
    
    // Spawn player with starter character
    const starterChar = inst('PrivateStorage.Character1');
    player.spawn(starterChar);
}

game.onServerStart(onServerStart);
game.onPlayerJoin(onPlayerJoin);`;
        }
      case 'ploidConfig':
        return `// Ploid Configuration Script
// This script configures the Ploid (Character Controller)

const ploid = inst('script.Parent');

// Player Owner Reference (set by the game engine)
ploid.PlayerOwner = null;  // Will be set when player spawns

// Health Properties
ploid.MaxHealth = 100;
ploid.Health = 100;

// Movement Properties
ploid.WalkSpeed = 16;
ploid.RunSpeed = 24;
ploid.JumpPower = 50;

// Physics Properties
ploid.Mass = 1;
ploid.Friction = 0.8;
ploid.Elasticity = 0.2;

// Functions
ploid.TakeDamage = function(amount) {
    ploid.Health = Math.max(0, ploid.Health - amount);
    if (ploid.Health <= 0) {
        ploid.OnDied.Fire();
    }
    ploid.HealthChanged.Fire(ploid.Health, ploid.MaxHealth);
};

ploid.Heal = function(amount) {
    ploid.Health = Math.min(ploid.MaxHealth, ploid.Health + amount);
    ploid.HealthChanged.Fire(ploid.Health, ploid.MaxHealth);
};

ploid.SetWalkSpeed = function(speed) {
    ploid.WalkSpeed = speed;
    ploid.WalkSpeedChanged.Fire(speed);
};

ploid.SetJumpPower = function(power) {
    ploid.JumpPower = power;
    ploid.JumpPowerChanged.Fire(power);
};

// Events
ploid.HealthChanged = game.CreateEvent();
ploid.WalkSpeedChanged = game.CreateEvent();
ploid.JumpPowerChanged = game.CreateEvent();
ploid.OnDied = game.CreateEvent();

console.log("Ploid configured successfully");`;
      case 'inputHandler':
        return `// Input Handler (Home Script)
// WARNING: Modifying this script may cause player movement issues!

const input = player.input;
const ploidConfig = character.Ploid.Config;

const keysPressed = {};

function onKeyDown(key) {
    keysPressed[key] = true;
    
    if (key === "w") {
        character.moveForward(ploidConfig.WalkSpeed);
    } else if (key === "s") {
        character.moveBackward(ploidConfig.WalkSpeed);
    } else if (key === "a") {
        character.moveLeft(ploidConfig.WalkSpeed);
    } else if (key === "d") {
        character.moveRight(ploidConfig.WalkSpeed);
    } else if (key === " ") {
        character.jump(ploidConfig.JumpPower);
    }
}

function onKeyUp(key) {
    keysPressed[key] = false;
    
    if (key === "w" || key === "s") {
        character.stopMovingForward();
    } else if (key === "a" || key === "d") {
        character.stopMovingLeft();
    }
}

inputService.onKeyDown(onKeyDown);
inputService.onKeyUp(onKeyUp);`;
      case 'cameraController':
        return `// Camera Controller (Home Script)
// WARNING: Modifying this script may cause camera issues!

const camera = inst('Workspace.Camera');
const mouse = player.Mouse;

let cameraType = "ThirdPerson"; // "ThirdPerson", "FirstPerson", "TopDown"
const sensitivity = 0.5;
const distance = 20;

function updateCamera() {
    if (cameraType === "ThirdPerson") {
        // Third person camera
        const offset = { x: 0, y: 5, z: distance };
        camera.position = character.position + offset;
        camera.lookAt(character.position);
    } else if (cameraType === "FirstPerson") {
        // First person camera
        camera.position = character.position + { x: 0, y: 1.5, z: 0 };
        camera.rotation = character.rotation;
    } else if (cameraType === "TopDown") {
        // Top-down camera
        camera.position = character.position + { x: 0, y: 30, z: 0 };
        camera.lookAt(character.position);
    }
}

function onMouseMove(deltaX, deltaY) {
    if (cameraType === "ThirdPerson") {
        // Rotate camera around character
        camera.rotateAroundTarget(character.position, deltaX * sensitivity, deltaY * sensitivity);
    } else if (cameraType === "FirstPerson") {
        // Rotate character
        character.rotate(deltaX * sensitivity, deltaY * sensitivity);
    }
}

function setCameraType(newType) {
    cameraType = newType;
    updateCamera();
}

// Expose camera controls
character.SetCameraType = setCameraType;

game.onHeartbeat(updateCamera);
mouse.onMove(onMouseMove);`;
      case 'movementController':
        return `// Movement Controller (Home Script)
// WARNING: Modifying this script may cause movement issues!

const ploidConfig = character.Ploid.Config;

const velocity = { x: 0, y: 0, z: 0 };
let isGrounded = true;
const gravity = -50;

function updateMovement(deltaTime) {
    // Apply gravity
    if (!isGrounded) {
        velocity.y = velocity.y + gravity * deltaTime;
    }
    
    // Update position
    character.position = character.position + velocity * deltaTime;
    
    // Check ground collision
    checkGroundCollision();
    
    // Apply friction
    velocity.x = velocity.x * 0.9;
    velocity.z = velocity.z * 0.9;
}

function checkGroundCollision() {
    // Simple ground check
    if (character.position.y <= 0) {
        character.position.y = 0;
        velocity.y = 0;
        isGrounded = true;
    } else {
        isGrounded = false;
    }
}

function moveForward(speed) {
    velocity.z = velocity.z - speed * 0.1;
}

function moveBackward(speed) {
    velocity.z = velocity.z + speed * 0.1;
}

function moveLeft(speed) {
    velocity.x = velocity.x - speed * 0.1;
}

function moveRight(speed) {
    velocity.x = velocity.x + speed * 0.1;
}

function jump(power) {
    if (isGrounded) {
        velocity.y = power;
        isGrounded = false;
    }
}

function stopMovingForward() {
    velocity.z = velocity.z * 0.5;
}

function stopMovingLeft() {
    velocity.x = velocity.x * 0.5;
}

// Expose movement functions
character.moveForward = moveForward;
character.moveBackward = moveBackward;
character.moveLeft = moveLeft;
character.moveRight = moveRight;
character.jump = jump;
character.stopMovingForward = stopMovingForward;
character.stopMovingLeft = stopMovingLeft;

game.onHeartbeat(updateMovement);`;
      case 'database':
        if (projectType === 'webapp') {
          return `// Application Database Schema
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

CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

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
        } else {
          return `// Player Database Schema
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    position_x REAL DEFAULT 0,
    position_y REAL DEFAULT 0,
    position_z REAL DEFAULT 0,
    health INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

// Game-specific tables
CREATE TABLE IF NOT EXISTS game_stats (
    id INTEGER PRIMARY KEY,
    player_id INTEGER,
    score INTEGER DEFAULT 0,
    playtime INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS player_inventory (
    id INTEGER PRIMARY KEY,
    player_id INTEGER,
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

function createPlayer(playerId, username) {
    INSERT INTO players (id, username) VALUES (playerId, username);
    INSERT INTO game_stats (player_id) VALUES (playerId);
}

function updatePlayerPosition(playerId, x, y, z) {
    UPDATE players SET position_x = x, position_y = y, position_z = z WHERE id = playerId;
}

function updatePlayerHealth(playerId, health) {
    UPDATE players SET health = health WHERE id = playerId;
}

function addExperience(playerId, exp) {
    UPDATE players SET experience = experience + exp WHERE id = playerId;
    
    // Check for level up
    const currentExp = SELECT experience FROM players WHERE id = playerId;
    const newLevel = Math.floor(currentExp / 100) + 1;
    UPDATE players SET level = newLevel WHERE id = playerId;
}`;
        }
      default:
        return '// Template script';
    }
  };

  const getTemplateUI = (projectType: string) => {
    return {
      elements: [
        {
          id: 'title',
          type: 'textlabel',
          name: 'TitleLabel',
          text: projectType === 'webapp' ? 'Web Application' : projectType === 'game3d' ? '3D Game' : '2D Game',
          position: { x: 300, y: 100 },
          size: { width: 200, height: 40 },
          style: {
            fontSize: 32,
            textColor: '#10B981',
            fontWeight: 'bold',
            backgroundColor: 'transparent',
            textAlign: 'center'
          }
        },
        {
          id: 'startButton',
          type: 'textbutton',
          name: 'StartButton',
          text: projectType === 'webapp' ? 'Launch App' : 'Start Game',
          position: { x: 340, y: 200 },
          size: { width: 120, height: 40 },
          style: {
            backgroundColor: '#10B981',
            textColor: 'white',
            fontSize: 16,
            textAlign: 'center'
          }
        }
      ]
    };
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    
    setIsCreating(true);
    
    // Simulate project creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const project = {
      name: projectName,
      type: projectType,
      created: new Date().toISOString(),
      services: getProjectTemplate(projectType)
    };
    
    onCreateProject(project);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-gray-900 to-black flex items-center justify-center p-6">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Infinity className="w-10 h-10 text-green-400" />
            <h1 className="text-3xl font-bold text-green-400">Virb.IO</h1>
          </div>
          <p className="text-gray-300">Create a new project to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Project Types */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Choose Project Type</h2>
            <div className="space-y-3">
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProjectType(type.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    projectType === type.id
                      ? 'border-green-400 bg-green-400/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={type.color}>{type.icon}</div>
                    <div>
                      <h3 className="font-semibold text-white">{type.name}</h3>
                      <p className="text-sm text-gray-400">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Project Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
                />
              </div>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Template includes:</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  {projectType === 'game3d' && (
                    <>
                      <li>• 3D workspace with baseplate</li>
                      <li>• <span className="text-red-400">Red cube character model</span> with Ploid</li>
                      <li>• Physics system</li>
                      <li>• Camera controls (Third/First person)</li>
                      <li>• Input handling scripts</li>
                      <li>• THREEDStorage plugin</li>
                      <li>• Workspace Config (THREED mode)</li>
                    </>
                  )}
                  {projectType === 'game2d' && (
                    <>
                      <li>• 2D workspace with ground</li>
                      <li>• 2D sprite system</li>
                      <li>• Player sprite assets</li>
                      <li>• 2D physics</li>
                      <li>• Input handling</li>
                      <li>• Starter character sprite with Ploid</li>
                      <li>• Workspace Config (TWOD mode)</li>
                    </>
                  )}
                  {projectType === 'webapp' && (
                    <>
                      <li>• API endpoint setup</li>
                      <li>• Database integration</li>
                      <li>• User management</li>
                      <li>• Frontend components</li>
                      <li>• Advanced syntax highlighter</li>
                      <li>• Workspace Config (OFF mode)</li>
                    </>
                  )}
                  {projectType === 'blank' && (
                    <>
                      <li>• Empty service hierarchy</li>
                      <li>• No pre-built templates</li>
                      <li>• Complete creative freedom</li>
                      <li>• Build from scratch</li>
                      <li>• Workspace Config (OFF mode)</li>
                    </>
                  )}
                  {projectType !== 'blank' && (
                    <>
                      <li>• Complete service hierarchy</li>
                      <li>• Database schema</li>
                      <li>• UI templates</li>
                      <li>• <span className="text-green-300">SharedStorage</span> - Shared assets & scripts</li>
                      <li>• <span className="text-orange-300">PrivateStorage</span> - Server-only content</li>
                      <li>• <span className="text-cyan-300">DataVault</span> - Database storage</li>
                    </>
                  )}
                </ul>
              </div>

              {projectType.includes('game') && (
                <div className="bg-yellow-900/20 border border-yellow-400/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-semibold text-sm">Important</span>
                  </div>
                  <p className="text-xs text-yellow-200">
                    Default player scripts (Input, Camera, Movement) are included. 
                    Modifying these may cause player functionality issues.
                  </p>
                </div>
              )}

              <button
                onClick={handleCreateProject}
                disabled={!projectName.trim() || isCreating}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};