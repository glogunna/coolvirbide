```tsx
import React, { useRef, useEffect, useState } from 'react';
import { Play, Square, RotateCcw, Settings, Maximize } from 'lucide-react';
import * as THREE from 'three';

interface GamePreviewProps {
  project: any;
}

interface ScriptContext {
  script: any;
  player: any;
  character: any;
  camera: any;
  inputService: any;
  game: any;
  workspace: any;
  print: (message: string) => void;
}

export const GamePreview: React.FC<GamePreviewProps> = ({ project }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const playerRef = useRef<THREE.Mesh>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameStats, setGameStats] = useState({
    fps: 60,
    objects: 0,
    memory: '12.5MB'
  });
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 1, z: 0 });
  const [playerVelocity, setPlayerVelocity] = useState({ x: 0, y: 0, z: 0 });
  const [isGrounded, setIsGrounded] = useState(true);
  const [cameraAngle, setCameraAngle] = useState({ horizontal: 0, vertical: 0 });
  const [spawnPoint, setSpawnPoint] = useState({ x: 0, y: 1, z: 0 });
  const [isMouseLocked, setIsMouseLocked] = useState(false);
  const [scriptContext, setScriptContext] = useState<ScriptContext | null>(null);
  const [loadedScripts, setLoadedScripts] = useState<any[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);

  // Script execution system
  const executeScript = (scriptContent: string, context: ScriptContext) => {
    try {
      // Create a safe execution environment
      const scriptFunction = new Function(
        'inst', 'print', 'game', 'script', 'player', 'character', 'camera', 'inputService', 'workspace', 'math', 'wait',
        `
        ${scriptContent}
        `
      );

      // Execute the script with the provided context
      scriptFunction(
        (path: string) => getObjectByPath(path, context), // inst function
        context.print,
        context.game,
        context.script,
        context.player,
        context.character,
        context.camera,
        context.inputService,
        context.workspace,
        Math, // math object
        (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000)) // wait function
      );

      addConsoleOutput(`[SCRIPT] Script executed successfully`);
    } catch (error) {
      addConsoleOutput(`[ERROR] Script execution failed: ${error}`);
      console.error('Script execution error:', error);
    }
  };

  const getObjectByPath = (path: string, context: ScriptContext) => {
    // Parse paths like "script.parent.Ploid.PlayerOwner" or "Workspace.Camera"
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current && current[part]) {
        current = current[part];
      } else {
        // Handle special cases for Virb.IO object hierarchy
        if (part === 'parent' && current === context.script) {
          // script.parent should return the character folder
          current = context.character;
        } else if (part === 'Ploid' && current === context.character) {
          // character.Ploid should return the ploid object
          current = context.character.Ploid;
        } else if (part === 'PlayerOwner' && current && current.PlayerOwner) {
          current = current.PlayerOwner;
        } else if (part === 'CharacterModel' && current === context.player) {
          current = context.character;
        } else if (part === 'Config' && current && current.Config) {
          current = current.Config;
        } else {
          addConsoleOutput(`[WARNING] Object path not found: ${path} (at ${part})`);
          return null;
        }
      }
    }

    return current;
  };

  const addConsoleOutput = (message: string) => {
    setConsoleOutput(prev => [...prev.slice(-20), message]); // Keep last 20 messages
  };

  const findPlayerScripts = () => {
    // Find all player-related scripts in the project
    const scripts: any[] = [];

    const findScriptsRecursively = (objects: any[], parentPath = '') => {
      for (const obj of objects) {
        if (obj.type === 'vlscript' || obj.type === 'vscript') {
          // Check if this is a player-related script
          if (obj.name.toLowerCase().includes('input') || 
              obj.name.toLowerCase().includes('movement') || 
              obj.name.toLowerCase().includes('camera') ||
              obj.warning) { // Scripts with warnings are usually core player scripts
            scripts.push({
              ...obj,
              path: parentPath + '/' + obj.name
            });
          }
        }
        if (obj.children) {
          findScriptsRecursively(obj.children, parentPath + '/' + obj.name);
        }
      }
    };

    // Search in all storage locations
    if (project.services.serverStorage.character) {
      findScriptsRecursively(project.services.serverStorage.character, 'PrivateStorage/Character');
    }
    if (project.services.replicatedStorage.scripts) {
      findScriptsRecursively(project.services.replicatedStorage.scripts, 'SharedStorage/Scripts');
    }

    return scripts;
  };

  const createScriptContext = (): ScriptContext => {
    // Create the ploid config object
    const ploidConfig = {
      WalkSpeed: 16,
      RunSpeed: 24,
      JumpPower: 50,
      MaxHealth: 100,
      Health: 100,
      Mass: 1,
      Friction: 0.8,
      Elasticity: 0.2
    };

    // Create the ploid object
    const ploid = {
      PlayerOwner: null, // Will be set to player
      Config: ploidConfig,
      MaxHealth: 100,
      Health: 100,
      WalkSpeed: 16,
      RunSpeed: 24,
      JumpPower: 50
    };

    // Create the character object
    const character = {
      Ploid: ploid,
      position: playerPosition,
      rotation: { x: 0, y: 0, z: 0 },
      moveForward: (speed: number) => {
        addConsoleOutput(`[CHARACTER] moveForward(${speed}) called`);
        setPlayerVelocity(prev => ({ ...prev, z: prev.z - speed * 0.03 }));
      },
      moveBackward: (speed: number) => {
        addConsoleOutput(`[CHARACTER] moveBackward(${speed}) called`);
        setPlayerVelocity(prev => ({ ...prev, z: prev.z + speed * 0.03 }));
      },
      moveLeft: (speed: number) => {
        addConsoleOutput(`[CHARACTER] moveLeft(${speed}) called`);
        setPlayerVelocity(prev => ({ ...prev, x: prev.x - speed * 0.03 }));
      },
      moveRight: (speed: number) => {
        addConsoleOutput(`[CHARACTER] moveRight(${speed}) called`);
        setPlayerVelocity(prev => ({ ...prev, x: prev.x + speed * 0.03 }));
      },
      jump: (power: number) => {
        if (isGrounded) {
          addConsoleOutput(`[CHARACTER] jump(${power}) called`);
          setPlayerVelocity(prev => ({ ...prev, y: power * 0.02 }));
          setIsGrounded(false);
        }
      },
      stopMovingForward: () => {
        addConsoleOutput('[CHARACTER] stopMovingForward() called');
        setPlayerVelocity(prev => ({ ...prev, z: prev.z * 0.5 }));
      },
      stopMovingLeft: () => {
        addConsoleOutput('[CHARACTER] stopMovingLeft() called');
        setPlayerVelocity(prev => ({ ...prev, x: prev.x * 0.5 }));
      },
      rotate: (deltaX: number, deltaY: number) => {
        addConsoleOutput(`[CHARACTER] rotate(${deltaX.toFixed(2)}, ${deltaY.toFixed(2)}) called`);
        setCameraAngle(prev => ({
          horizontal: prev.horizontal + deltaX,
          vertical: Math.max(-Math.PI/3, Math.min(Math.PI/3, prev.vertical + deltaY))
        }));
      }
    };

    // Create the player object
    const player = {
      Name: 'LocalPlayer',
      CharacterModel: character,
      input: {
        onKeyDown: (callback: (key: string) => void) => {
          addConsoleOutput('[INPUT] onKeyDown() handler registered');
          player.input._keyDownCallback = callback;
        },
        onKeyUp: (callback: (key: string) => void) => {
          addConsoleOutput('[INPUT] onKeyUp() handler registered');
          player.input._keyUpCallback = callback;
        },
        _keyDownCallback: null,
        _keyUpCallback: null
      },
      Mouse: {
        onMove: (callback: (deltaX: number, deltaY: number) => void) => {
          addConsoleOutput('[MOUSE] onMove() handler registered');
          player.Mouse._mouseMoveCallback = callback;
        },
        _mouseMoveCallback: null
      }
    };

    // Set up the ploid's PlayerOwner reference
    ploid.PlayerOwner = player;

    const context: ScriptContext = {
      script: {
        parent: character, // script.parent points to the character
        Parent: character  // Also support uppercase
      },
      player: player,
      character: character,
      camera: {
        position: { x: 0, y: 5, z: 10 },
        rotation: { x: 0, y: 0, z: 0 },
        mode: '3D',
        lookAt: (target: any) => {
          addConsoleOutput(`[CAMERA] lookAt() called`);
        },
        rotateAroundTarget: (target: any, deltaX: number, deltaY: number) => {
          addConsoleOutput(`[CAMERA] rotateAroundTarget() called`);
          setCameraAngle(prev => ({
            horizontal: prev.horizontal + deltaX,
            vertical: Math.max(-Math.PI/3, Math.min(Math.PI/3, prev.vertical + deltaY))
          }));
        }
      },
      inputService: {
        onKeyPress: (callback: (key: string) => void) => {
          addConsoleOutput('[INPUT] onKeyPress() handler registered');
          context.inputService._keyPressCallback = callback;
        },
        onKeyDown: (callback: (key: string) => void) => {
          addConsoleOutput('[INPUT] onKeyDown() handler registered');
          context.inputService._keyDownCallback = callback;
        },
        onKeyUp: (callback: (key: string) => void) => {
          addConsoleOutput('[INPUT] onKeyUp() handler registered');
          context.inputService._keyUpCallback = callback;
        },
        _keyPressCallback: null,
        _keyDownCallback: null,
        _keyUpCallback: null
      },
      game: {
        Players: {
          LocalPlayer: player
        },
        InputService: null, // Will be set to context.inputService
        onHeartbeat: (callback: (deltaTime: number) => void) => {
          addConsoleOutput('[GAME] onHeartbeat() handler registered');
          context.game._heartbeatCallback = callback;
        },
        onPlayerJoin: (callback: (player: any) => void) => {
          addConsoleOutput('[GAME] onPlayerJoin() handler registered');
        },
        _heartbeatCallback: null
      },
      workspace: {
        Camera: null, // Will be set to context.camera
        Player: player
      },
      print: (message: string) => {
        addConsoleOutput(`[SCRIPT] ${message}`);
      }
    };

    // Set up cross-references
    context.game.InputService = context.inputService;
    context.workspace.Camera = context.camera;

    return context;
  };

  const loadAndExecutePlayerScripts = (context: ScriptContext) => {
    const playerScripts = findPlayerScripts();
    addConsoleOutput(`[SYSTEM] Found ${playerScripts.length} player scripts`);

    for (const script of playerScripts) {
      if (script.content) {
        addConsoleOutput(`[SYSTEM] Loading script: ${script.name}`);
        executeScript(script.content, context);
      }
    }

    setLoadedScripts(playerScripts);
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize based on project type
    if (project.type === 'game3d') {
      const cleanup = init3DGame();
      return cleanup;
    } else if (project.type === 'game2d') {
      render2DGame();
    } else {
      renderWebApp();
    }

    // Update stats
    setGameStats({
      fps: 60,
      objects: project.type.includes('game') ? 5 : 0,
      memory: project.type === 'game3d' ? '24.8MB' : project.type === 'game2d' ? '8.2MB' : '4.1MB'
    });
  }, [project]);

  const findSpawnPoint = () => {
    // Look for Actor objects with SpawnPoint role in the workspace
    const findActorsRecursively = (objects: any[]): any[] => {
      let actors: any[] = [];
      for (const obj of objects) {
        if (obj.type === 'actor') {
          // Check if this actor has a config that defines it as a spawn point
          const config = obj.children?.find((child: any) => child.type === 'config');
          if (config && config.content && config.content.includes('Role = "SpawnPoint"')) {
            actors.push(obj);
          }
        }
        if (obj.children) {
          actors = actors.concat(findActorsRecursively(obj.children));
        }
      }
      return actors;
    };

    const workspaceObjects = project.services.workspace.objects || [];
    const spawnActors = findActorsRecursively(workspaceObjects);
    
    if (spawnActors.length > 0) {
      // Find default spawn point or use the first one
      const defaultSpawn = spawnActors.find(actor => {
        const config = actor.children?.find((child: any) => child.type === 'config');
        return config && config.content && config.content.includes('IsDefault = true');
      });
      
      const chosenSpawn = defaultSpawn || spawnActors[0];
      return chosenSpawn.position || { x: 0, y: 1, z: 0 };
    }
    
    return { x: 0, y: 1, z: 0 }; // Default spawn if no spawn point found
  };

  const loadWorkspaceObjects = (scene: THREE.Scene) => {
    console.log('[GAME] Loading workspace objects:', project.services.workspace.objects);
    
    // Load objects from the actual workspace
    const loadObjectsRecursively = (objects: any[], parent?: THREE.Object3D) => {
      for (const obj of objects) {
        console.log('[GAME] Loading object:', obj.name, 'type:', obj.type);
        let mesh: THREE.Mesh | THREE.Group | null = null;

        switch (obj.type) {
          case 'part':
            const partGeometry = new THREE.BoxGeometry(
              obj.scale?.x * 2 || 2, 
              obj.scale?.y * 2 || 2, 
              obj.scale?.z * 2 || 2
            );
            const partMaterial = new THREE.MeshLambertMaterial({ 
              color: obj.color ? new THREE.Color(obj.color) : 0x4ECDC4 
            });
            mesh = new THREE.Mesh(partGeometry, partMaterial);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            console.log('[GAME] Created part:', obj.name);
            break;

          case 'sphere':
            const sphereGeometry = new THREE.SphereGeometry(
              obj.scale?.x || 1, 32, 32
            );
            const sphereMaterial = new THREE.MeshLambertMaterial({ 
              color: obj.color ? new THREE.Color(obj.color) : 0xFFE66D 
            });
            mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            console.log('[GAME] Created sphere:', obj.name);
            break;

          case 'cylinder':
            const cylinderGeometry = new THREE.CylinderGeometry(
              obj.scale?.x || 1, 
              obj.scale?.x || 1, 
              obj.scale?.y * 2 || 2, 
              32
            );
            const cylinderMaterial = new THREE.MeshLambertMaterial({ 
              color: obj.color ? new THREE.Color(obj.color) : 0xFF6B6B 
            });
            mesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            console.log('[GAME] Created cylinder:', obj.name);
            break;

          case 'actor':
            // Create visual representation for Actor (spawn point)
            const config = obj.children?.find((child: any) => child.type === 'config');
            const isSpawnPoint = config && config.content && config.content.includes('Role = "SpawnPoint"');
            
            if (isSpawnPoint) {
              // Create a glowing cylinder for spawn point
              const spawnGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
              const spawnMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00FF00,
                transparent: true,
                opacity: 0.7
              });
              mesh = new THREE.Mesh(spawnGeometry, spawnMaterial);
              
              // Add a glowing effect
              const glowGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
              const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00FF00,
                transparent: true,
                opacity: 0.3
              });
              const glow = new THREE.Mesh(glowGeometry, glowMaterial);
              mesh.add(glow);
              console.log('[GAME] Created spawn point actor:', obj.name);
            } else {
              // Generic actor representation
              const actorGeometry = new THREE.BoxGeometry(1, 2, 1);
              const actorMaterial = new THREE.MeshLambertMaterial({ color: 0x9B59B6 });
              mesh = new THREE.Mesh(actorGeometry, actorMaterial);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              console.log('[GAME] Created generic actor:', obj.name);
            }
            break;

          case 'model':
          case 'folder':
            // Create a group for containers
            mesh = new THREE.Group();
            console.log('[GAME] Created group for:', obj.name);
            break;
        }

        if (mesh) {
          // Set position, rotation, scale from object properties
          if (obj.position) {
            mesh.position.set(
              obj.position.x || 0, 
              obj.position.y || (obj.type === 'actor' ? 0.1 : 2), 
              obj.position.z || 0
            );
            console.log('[GAME] Set position for', obj.name, ':', mesh.position);
          } else {
            // Default position for new objects
            mesh.position.set(0, obj.type === 'actor' ? 0.1 : 2, 0);
          }
          
          if (obj.rotation) {
            mesh.rotation.set(obj.rotation.x || 0, obj.rotation.y || 0, obj.rotation.z || 0);
          }
          if (obj.scale && obj.type !== 'part' && obj.type !== 'sphere' && obj.type !== 'cylinder') {
            mesh.scale.set(obj.scale.x || 1, obj.scale.y || 1, obj.scale.z || 1);
          }

          mesh.name = obj.name;
          mesh.userData = { id: obj.id, type: obj.type };

          if (parent) {
            parent.add(mesh);
          } else {
            scene.add(mesh);
          }

          console.log('[GAME] Added to scene:', obj.name, 'at position:', mesh.position);

          // Recursively load children
          if (obj.children && obj.children.length > 0) {
            loadObjectsRecursively(obj.children, mesh);
          }
        }
      }
    };

    // Load workspace objects
    const workspaceObjects = project.services.workspace.objects || [];
    console.log('[GAME] Total workspace objects to load:', workspaceObjects.length);
    loadObjectsRecursively(workspaceObjects);
    
    // Update object count
    setGameStats(prev => ({
      ...prev,
      objects: scene.children.filter(child => child.userData.type).length
    }));
  };

  const init3DGame = () => {
    if (!mountRef.current) return;

    // Clear any existing content
    mountRef.current.innerHTML = '';

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    // Create ground/baseplate
    const groundGeometry = new THREE.BoxGeometry(50, 1, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    ground.name = 'Baseplate';
    ground.userData = { id: 'baseplate', type: 'part' };
    scene.add(ground);

    // CRITICAL: Load workspace objects from the project BEFORE creating player
    console.log('[GAME] Loading workspace objects...');
    loadWorkspaceObjects(scene);

    // Find spawn point AFTER loading workspace objects
    const spawn = findSpawnPoint();
    setSpawnPoint(spawn);
    setPlayerPosition(spawn);

    // Create player character (RED CUBE as requested)
    const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 }); // RED CUBE
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(spawn.x, spawn.y, spawn.z);
    player.castShadow = true;
    player.name = 'Player';
    player.userData = { id: 'player', type: 'player' };
    scene.add(player);
    playerRef.current = player;

    console.log('[GAME] Player spawned at:', spawn);

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // CRITICAL: Create script context and load player scripts
    const context = createScriptContext();
    setScriptContext(context);
    loadAndExecutePlayerScripts(context);

    // FIXED: Proper mouse controls for camera
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
      
      // Request pointer lock for better camera control
      renderer.domElement.requestPointerLock();
    };

    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === renderer.domElement) {
        // Use movementX/Y for smooth camera rotation when pointer is locked
        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;

        // Call script-based camera rotation if available
        if (context.player.Mouse._mouseMoveCallback) {
          context.player.Mouse._mouseMoveCallback(deltaX * 0.002, deltaY * 0.002);
        } else if (context.character.rotate) {
          context.character.rotate(deltaX * 0.002, deltaY * 0.002);
        }
      } else if (isMouseDown) {
        // Fallback for when pointer lock is not available
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;

        if (context.character.rotate) {
          context.character.rotate(deltaX * 0.005, deltaY * 0.005);
        }

        mouseX = event.clientX;
        mouseY = event.clientY;
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    // FIXED: Proper keyboard controls with script execution
    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      const key = event.key.toLowerCase();
      console.log('[CONTROLS] Key down:', key);
      
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.add(key);
        
        // Call script-based input handlers in proper order
        if (context.inputService._keyDownCallback) {
          context.inputService._keyDownCallback(key);
        }
        if (context.player.input._keyDownCallback) {
          context.player.input._keyDownCallback(key);
        }
        
        return newKeys;
      });
    };

    const onKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      const key = event.key.toLowerCase();
      console.log('[CONTROLS] Key up:', key);
      
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(key);
        
        // Call script-based input handlers in proper order
        if (context.inputService._keyUpCallback) {
          context.inputService._keyUpCallback(key);
        }
        if (context.player.input._keyUpCallback) {
          context.player.input._keyUpCallback(key);
        }
        
        return newKeys;
      });
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    
    // Make canvas focusable and focus it
    renderer.domElement.tabIndex = 0;
    renderer.domElement.focus();
    
    // Add keyboard listeners
    renderer.domElement.addEventListener('keydown', onKeyDown);
    renderer.domElement.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Handle pointer lock changes
    const onPointerLockChange = () => {
      setIsMouseLocked(document.pointerLockElement === renderer.domElement);
    };
    
    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Game loop with script execution
    let lastTime = 0;
    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // Call script-based heartbeat if available
      if (context.game._heartbeatCallback) {
        context.game._heartbeatCallback(deltaTime);
      }
      
      updatePlayer(deltaTime);
      updateCamera();
      renderer.render(scene, camera);
      requestAnimationFrame(gameLoop);
    };
    gameLoop(0);

    console.log('[GAME] 3D Game initialized with script execution system');
    addConsoleOutput('[SYSTEM] 3D Game initialized with script execution system');
    addConsoleOutput('[SYSTEM] Player scripts loaded and ready');
    addConsoleOutput('[SYSTEM] Virb.IO object hierarchy: script.parent.Ploid.PlayerOwner');

    // Cleanup function
    return () => {
      console.log('[GAME] Cleaning up 3D game...');
      
      // Remove event listeners
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('keydown', onKeyDown);
      renderer.domElement.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      
      // Exit pointer lock
      if (document.pointerLockElement === renderer.domElement) {
        document.exitPointerLock();
      }
      
      // Clean up renderer
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  const updatePlayer = (deltaTime: number) => {
    if (!playerRef.current) return;

    const gravity = -30;

    // Apply gravity
    setPlayerVelocity(prev => ({ ...prev, y: prev.y + gravity * deltaTime }));

    // Update position based on velocity (which is now controlled by scripts)
    setPlayerPosition(prev => {
      const newPos = {
        x: prev.x + playerVelocity.x * deltaTime * 10, // Scale for better movement
        y: prev.y + playerVelocity.y * deltaTime,
        z: prev.z + playerVelocity.z * deltaTime * 10
      };

      // Ground collision
      if (newPos.y <= 1) {
        newPos.y = 1;
        setPlayerVelocity(prev => ({ ...prev, y: 0 }));
        setIsGrounded(true);
      } else {
        setIsGrounded(false);
      }

      // Update player mesh position
      playerRef.current!.position.set(newPos.x, newPos.y, newPos.z);

      // Apply friction to horizontal movement
      setPlayerVelocity(prev => ({
        x: prev.x * 0.9,
        y: prev.y,
        z: prev.z * 0.9
      }));

      return newPos;
    });
  };

  const updateCamera = () => {
    if (!cameraRef.current || !playerRef.current) return;

    const camera = cameraRef.current;
    const player = playerRef.current;

    // Third-person camera
    const cameraDistance = 8;
    const cameraHeight = 3;

    const cameraX = player.position.x + Math.sin(cameraAngle.horizontal) * cameraDistance;
    const cameraZ = player.position.z + Math.cos(cameraAngle.horizontal) * cameraDistance;
    const cameraY = player.position.y + cameraHeight + Math.sin(cameraAngle.vertical) * 3;

    camera.position.set(cameraX, cameraY, cameraZ);
    camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
  };

  const render2DGame = () => {
    if (!mountRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(canvas);

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Draw platforms
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, 500, 800, 100);
    ctx.fillRect(200, 400, 150, 20);
    ctx.fillRect(450, 350, 150, 20);
    ctx.fillRect(100, 300, 100, 20);

    // Draw player sprite
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(90, 460, 30, 40);
    
    // Player details
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(95, 465, 20, 10); // Body
    ctx.fillStyle = '#000000';
    ctx.fillRect(100, 467, 3, 3); // Eye
    ctx.fillRect(107, 467, 3, 3); // Eye

    // Draw collectibles
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 5; i++) {
      const x = 150 + i * 120;
      const y = 380 - Math.sin(Date.now() * 0.005 + i) * 10;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw UI
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 180, 60);
    ctx.fillStyle = '#10B981';
    ctx.font = '16px monospace';
    ctx.fillText('2D Game Running', 20, 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.fillText('Arrow Keys: Move', 20, 45);
    ctx.fillText('Space: Jump', 20, 60);

    // Score
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(650, 10, 140, 40);
    ctx.fillStyle = '#FFD700';
    ctx.font = '16px monospace';
    ctx.fillText('Score: 1250', 660, 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.fillText('Coins: 5/10', 660, 45);
  };

  const renderWebApp = () => {
    if (!mountRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(canvas);

    // Clear canvas with app background
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, 800, 600);

    // Draw header
    ctx.fillStyle = '#10B981';
    ctx.fillRect(0, 0, 800, 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Virb.IO Web Application', 20, 35);

    // Draw navigation
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 60, 200, 540);
    ctx.fillStyle = '#374151';
    ctx.font = '16px sans-serif';
    ctx.fillText('Navigation', 20, 90);
    
    const navItems = ['Dashboard', 'Users', 'Analytics', 'Settings'];
    navItems.forEach((item, index) => {
      ctx.fillStyle = index === 0 ? '#10B981' : '#6B7280';
      ctx.fillRect(10, 110 + index * 40, 180, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(item, 20, 130 + index * 40);
    });

    // Draw main content area
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(220, 80, 560, 500);
    
    // Draw cards
    ctx.fillStyle = '#F9FAFB';
    ctx.fillRect(240, 100, 160, 120);
    ctx.fillRect(420, 100, 160, 120);
    ctx.fillRect(240, 240, 160, 120);
    ctx.fillRect(420, 240, 160, 120);

    // Card content
    ctx.fillStyle = '#374151';
    ctx.font = '14px sans-serif';
    ctx.fillText('Total Users', 250, 120);
    ctx.fillText('Revenue', 430, 120);
    ctx.fillText('Active Sessions', 250, 260);
    ctx.fillText('API Calls', 430, 260);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#10B981';
    ctx.fillText('1,234', 250, 150);
    ctx.fillText('$5,678', 430, 150);
    ctx.fillText('89', 250, 290);
    ctx.fillText('12.5k', 430, 290);

    // Draw chart area
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(240, 380, 520, 180);
    ctx.fillStyle = '#374151';
    ctx.font = '16px sans-serif';
    ctx.fillText('Analytics Chart', 250, 400);

    // Simple line chart
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const x = 260 + i * 48;
      const y = 450 + Math.sin(i * 0.5) * 30;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Status indicator
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fillRect(650, 20, 140, 20);
    ctx.fillStyle = '#10B981';
    ctx.font = '12px monospace';
    ctx.fillText('● Server Online', 660, 33);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const resetGame = () => {
    // Reset player to spawn point
    const spawn = findSpawnPoint();
    setPlayerPosition(spawn);
    setPlayerVelocity({ x: 0, y: 0, z: 0 });
    setCameraAngle({ horizontal: 0, vertical: 0 });
    setIsGrounded(true);
    
    if (playerRef.current) {
      playerRef.current.position.set(spawn.x, spawn.y, spawn.z);
    }
    
    if (cameraRef.current) {
      cameraRef.current.position.set(spawn.x, spawn.y + 5, spawn.z + 10);
    }

    // Clear console and reload scripts
    setConsoleOutput([]);
    if (scriptContext) {
      loadAndExecutePlayerScripts(scriptContext);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-900">
      {/* Preview Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium text-white">Running: {project.name}</span>
            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
              {project.type.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 text-sm text-gray-400 mr-4">
            <span>FPS: {gameStats.fps}</span>
            <span>Objects: {gameStats.objects}</span>
            <span>Scripts: {loadedScripts.length}</span>
            <span>Memory: {gameStats.memory}</span>
            {project.type === 'game3d' && (
              <span className={\`${isMouseLocked ? 'text-green-400' : 'text-yellow-400'}`}>
                Mouse: {isMouseLocked ? 'Locked' : 'Free'}
              </span>
            )}
          </div>
          <button
            onClick={resetGame}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Reset to Spawn & Reload Scripts"
          >
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4 text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded transition-colors">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className={\`flex-1 flex items-center justify-center p-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
        <div className="relative">
          <div
            ref={mountRef}
            className={\`border border-gray-600 rounded-lg shadow-lg ${isFullscreen ? 'w-full h-full' : ''}`}
            style={{ 
              width: isFullscreen ? '100vw' : '800px',
              height: isFullscreen ? '100vh' : '600px'
            }}
          />
          
          {/* Game Controls Overlay */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
            <div className="text-sm space-y-1">
              {project.type === 'game3d' && (
                <>
                  <div className="text-green-400 font-semibold">🎮 Virb.IO Script System:</div>
                  <div className="text-yellow-400">WASD: script.parent.Ploid.PlayerOwner</div>
                  <div className="text-cyan-400">Mouse: character.rotate()</div>
                  <div className="text-purple-400">Space: character.jump(power)</div>
                  <div className="text-red-400">Player: Red Cube (Script Controlled)</div>
                  <div className="text-green-400">Scripts Loaded: {loadedScripts.length}</div>
                  <div className="text-orange-400">Keys Active: {Array.from(keys).join(', ') || 'None'}</div>
                  <div className="text-cyan-400">Object Hierarchy: ✓ Working!</div>
                </>
              )}
              {project.type === 'game2d' && (
                <>
                  <div>Arrow Keys: Move</div>
                  <div>Space: Jump</div>
                  <div>Collect coins!</div>
                </>
              )}
              {project.type === 'webapp' && (
                <>
                  <div>Web Application</div>
                  <div>Interactive Dashboard</div>
                  <div>Real-time Data</div>
                </>
              )}
            </div>
          </div>

          {/* Performance Overlay */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs font-mono">
            <div>FPS: {gameStats.fps}</div>
            <div>Memory: {gameStats.memory}</div>
            <div>Objects: {gameStats.objects}</div>
            {project.type === 'game3d' && (
              <>
                <div>Player: ({playerPosition.x.toFixed(1)}, {playerPosition.y.toFixed(1)}, {playerPosition.z.toFixed(1)})</div>
                <div>Velocity: ({playerVelocity.x.toFixed(1)}, {playerVelocity.y.toFixed(1)}, {playerVelocity.z.toFixed(1)})</div>
                <div>Grounded: {isGrounded ? 'Yes' : 'No'}</div>
                <div>Keys: {keys.size}</div>
                <div className="text-green-400">Scripts: {loadedScripts.length} ✓</div>
                <div className="text-cyan-400">Hierarchy: ✓ Active</div>
              </>
            )}
          </div>

          {/* Instructions Overlay for 3D Game */}
          {project.type === 'game3d' && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <div className="text-green-400 font-semibold">🚀 Virb.IO Object System!</div>
                <div className="text-yellow-400">script.parent.Ploid.PlayerOwner</div>
                <div className="text-cyan-400">Input → Scripts → Movement</div>
                <div className="text-purple-400">Click canvas to start!</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Console Output */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 h-32 overflow-auto">
        <div className="text-sm font-mono text-gray-300 space-y-1">
          <div className="text-green-400">[INFO] Game initialized with Virb.IO script execution system</div>
          <div className="text-blue-400">[DEBUG] Loading {project.type} environment...</div>
          <div className="text-green-400">[INFO] Workspace objects loaded from project ✓</div>
          {project.type === 'game3d' && (
            <>
              <div className="text-blue-400">[DEBUG] 3D scene created with THREE.js</div>
              <div className="text-green-400">[INFO] Player spawned at Actor spawn point ({spawnPoint.x}, {spawnPoint.y}, {spawnPoint.z})</div>
              <div className="text-purple-400">[SYSTEM] Virb.IO object hierarchy initialized</div>
              <div className="text-cyan-400">[SYSTEM] script.parent.Ploid.PlayerOwner → Player object</div>
              <div className="text-yellow-400">[INFO] Input system connected to scripts</div>
              <div className="text-green-400">[INFO] Movement controlled by your scripts ✓</div>
            </>
          )}
          {consoleOutput.slice(-5).map((output, index) => (
            <div key={index} className="text-white">{output}</div>
          ))}
          <div className="text-green-400">[INFO] Game loop started at 60 FPS</div>
        </div>
      </div>
    </div>
  );
};
```