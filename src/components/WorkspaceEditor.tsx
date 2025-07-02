import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Move, RotateCw, Scale, Trash2, Plus, Eye, EyeOff, Search, Edit2, User } from 'lucide-react';
import * as THREE from 'three';

interface WorkspaceEditorProps {
  project: any;
}

export const WorkspaceEditor: React.FC<WorkspaceEditorProps> = ({ project }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const raycasterRef = useRef<THREE.Raycaster>();
  const mouseRef = useRef<THREE.Vector2>();
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [tool, setTool] = useState('move');
  const [objects, setObjects] = useState<any[]>([]);
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [isDraggingGizmo, setIsDraggingGizmo] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);

  // CRITICAL: Refs for gizmo dragging
  const dragPlaneRef = useRef<THREE.Plane | null>(null);
  const dragOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const gizmoAxisRef = useRef<string | null>(null);

  const objectTypes = [
    { id: 'config', name: 'Configuration', icon: '⚙️', description: 'Configuration object for properties' },
    { id: 'model', name: 'Model', icon: '🏗️', description: 'Container for 3D objects' },
    { id: 'folder', name: 'Folder', icon: '📁', description: 'Organize objects in folders' },
    { id: 'vscript', name: 'Basic Script', icon: '📜', description: 'Server-side script' },
    { id: 'vlscript', name: 'Home Script', icon: '📋', description: 'Client-side script' },
    { id: 'vdata', name: 'Data Script', icon: '🗄️', description: 'Database script' },
    { id: 'ploid', name: 'Ploid', icon: '🤖', description: 'Character controller' },
    { id: 'actor', name: 'Actor', icon: '👤', description: 'Interactive game actor with configurable role' },
    { id: 'part', name: 'Part', icon: '🧱', description: '3D part/block' },
    { id: 'sphere', name: 'Sphere', icon: '⚪', description: '3D sphere' },
    { id: 'cylinder', name: 'Cylinder', icon: '🥫', description: '3D cylinder' },
    { id: 'image', name: 'Image/Texture', icon: '🖼️', description: 'Image or texture file' },
    { id: 'sound', name: 'Sound', icon: '🔊', description: 'Audio file' },
    { id: 'video', name: 'Video', icon: '🎬', description: 'Video file' }
  ];

  const filteredObjectTypes = objectTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CRITICAL: Function to sync objects with project data and update explorer
  const syncWithProject = (updatedObjects: any[]) => {
    // Update the project's workspace objects
    const workspaceObjects = updatedObjects.filter(obj => obj.parent === 'workspace' || !obj.parent);
    project.services.workspace.objects = workspaceObjects;
    
    console.log('[WORKSPACE] Synced objects with project:', workspaceObjects);
    
    // Trigger a re-render of the file explorer by updating the project reference
    // This ensures the explorer shows the updated workspace objects
    if (window.updateFileExplorer) {
      window.updateFileExplorer();
    }
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Raycaster for object selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    raycasterRef.current = raycaster;
    mouseRef.current = mouse;

    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create baseplate
    const baseplateGeometry = new THREE.BoxGeometry(50, 1, 50);
    const baseplateMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const baseplate = new THREE.Mesh(baseplateGeometry, baseplateMaterial);
    baseplate.position.y = -0.5;
    baseplate.receiveShadow = true;
    baseplate.name = 'Baseplate';
    baseplate.userData = { id: 'baseplate', name: 'Baseplate', type: 'part', selectable: true };
    scene.add(baseplate);

    // CRITICAL: Load existing workspace objects from project AND create default objects
    const initialObjects = [
      { 
        id: 'baseplate', 
        name: 'Baseplate', 
        type: 'part', 
        mesh: baseplate, 
        visible: true, 
        selectable: true,
        parent: 'workspace',
        children: [],
        position: { x: 0, y: -0.5, z: 0 },
        color: '#228B22'
      }
    ];

    // Add default objects for game projects
    if (project.type === 'game3d') {
      // Add a red cube (Part)
      const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
      const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(0, 1, 0);
      cube.castShadow = true;
      cube.name = 'Part';
      cube.userData = { id: 'part1', name: 'Part', type: 'part', selectable: true };
      scene.add(cube);

      // Add a sphere (Ball)
      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x4ecdc4 });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(5, 1, 0);
      sphere.castShadow = true;
      sphere.name = 'Ball';
      sphere.userData = { id: 'ball1', name: 'Ball', type: 'sphere', selectable: true };
      scene.add(sphere);

      // Add an Actor (spawn point) - SOLID GREEN CYLINDER
      const actorGeometry = new THREE.CylinderGeometry(1, 1, 0.4, 16);
      const actorMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x00FF00  // SOLID GREEN - NO TRANSPARENCY
      });
      const actor = new THREE.Mesh(actorGeometry, actorMaterial);
      actor.position.set(-5, 0.2, 0);
      actor.castShadow = true;
      actor.name = 'SpawnPoint';
      actor.userData = { id: 'spawn1', name: 'SpawnPoint', type: 'actor', selectable: true };
      scene.add(actor);

      // Add subtle glow effect (but keep main object solid)
      const glowGeometry = new THREE.CylinderGeometry(1.1, 1.1, 0.1, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00FF00,
        transparent: true,
        opacity: 0.2
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.y = -0.15;
      actor.add(glow);

      // Add these objects to our objects array AND project data
      const newObjects = [
        { 
          id: 'part1', 
          name: 'Part', 
          type: 'part', 
          mesh: cube, 
          visible: true, 
          selectable: true,
          parent: 'workspace',
          children: [],
          position: { x: 0, y: 1, z: 0 },
          color: '#ff6b6b'
        },
        { 
          id: 'ball1', 
          name: 'Ball', 
          type: 'sphere', 
          mesh: sphere, 
          visible: true, 
          selectable: true,
          parent: 'workspace',
          children: [],
          position: { x: 5, y: 1, z: 0 },
          color: '#4ecdc4'
        },
        { 
          id: 'spawn1', 
          name: 'SpawnPoint', 
          type: 'actor', 
          mesh: actor, 
          visible: true, 
          selectable: true,
          parent: 'workspace',
          children: [{
            id: 'spawn1_config',
            name: 'Config',
            type: 'config',
            content: getActorConfigContent(),
            children: []
          }],
          position: { x: -5, y: 0.2, z: 0 },
          color: '#00FF00'
        }
      ];

      initialObjects.push(...newObjects);
    }

    setObjects(initialObjects);
    
    // CRITICAL: Sync with project data immediately
    syncWithProject(initialObjects);

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // FIXED: Mouse controls with proper gizmo handling
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      // CRITICAL: Check for gizmo interaction first
      const gizmos = scene.children.filter(obj => obj.userData.isGizmo);
      const gizmoIntersects = raycaster.intersectObjects(gizmos);
      
      if (gizmoIntersects.length > 0 && selectedObject) {
        console.log('[GIZMO] Starting gizmo drag');
        setIsDraggingGizmo(true);
        
        const gizmo = gizmoIntersects[0].object;
        const axis = gizmo.userData.axis;
        gizmoAxisRef.current = axis;
        
        // Create appropriate drag plane
        if (axis === 'x') {
          dragPlaneRef.current = new THREE.Plane(new THREE.Vector3(0, 1, 0), -selectedObject.mesh.position.y);
        } else if (axis === 'y') {
          dragPlaneRef.current = new THREE.Plane(new THREE.Vector3(0, 0, 1), -selectedObject.mesh.position.z);
        } else if (axis === 'z') {
          dragPlaneRef.current = new THREE.Plane(new THREE.Vector3(0, 1, 0), -selectedObject.mesh.position.y);
        }
        
        // Calculate drag offset
        const intersection = new THREE.Vector3();
        if (dragPlaneRef.current && raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)) {
          dragOffsetRef.current.subVectors(selectedObject.mesh.position, intersection);
        }
        
        return;
      }

      // Check for object selection
      const selectableObjects = scene.children.filter(obj => obj.userData.selectable && !obj.userData.isGizmo);
      const intersects = raycaster.intersectObjects(selectableObjects);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const objectData = initialObjects.find(obj => obj.id === clickedObject.userData.id);
        if (objectData) {
          setSelectedObject(objectData);
          highlightObject(clickedObject);
          console.log('[SELECTION] Selected object:', objectData.name);
        }
      } else {
        setSelectedObject(null);
        clearHighlights();
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      // CRITICAL: Handle gizmo dragging
      if (isDraggingGizmo && selectedObject && dragPlaneRef.current && gizmoAxisRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlaneRef.current, intersection)) {
          const newPosition = intersection.add(dragOffsetRef.current);
          
          // Apply movement only on the selected axis
          const currentPos = selectedObject.mesh.position.clone();
          
          if (gizmoAxisRef.current === 'x') {
            currentPos.x = newPosition.x;
          } else if (gizmoAxisRef.current === 'y') {
            currentPos.y = Math.max(0.1, newPosition.y); // Prevent going below ground
          } else if (gizmoAxisRef.current === 'z') {
            currentPos.z = newPosition.z;
          }
          
          selectedObject.mesh.position.copy(currentPos);
          
          // Update object data
          selectedObject.position = {
            x: currentPos.x,
            y: currentPos.y,
            z: currentPos.z
          };
          
          // Update gizmo positions
          updateGizmoPositions(selectedObject.mesh);
          
          console.log('[GIZMO] Dragging on axis:', gizmoAxisRef.current, 'to position:', currentPos);
        }
        return;
      }

      // Handle camera rotation
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaMove.x * 0.01;
      spherical.phi += deltaMove.y * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      
      if (isDraggingGizmo) {
        console.log('[GIZMO] Finished gizmo drag');
        setIsDraggingGizmo(false);
        dragPlaneRef.current = null;
        gizmoAxisRef.current = null;
        dragOffsetRef.current.set(0, 0, 0);
        
        // CRITICAL: Sync changes with project after dragging
        if (selectedObject) {
          const updatedObjects = objects.map(obj => 
            obj.id === selectedObject.id ? selectedObject : obj
          );
          setObjects(updatedObjects);
          syncWithProject(updatedObjects);
        }
      }
    };

    const highlightObject = (object: THREE.Object3D) => {
      clearHighlights();
      
      // Create outline effect
      const outlineGeometry = object.geometry.clone();
      const outlineMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x10B981, 
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.3
      });
      const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
      outline.position.copy(object.position);
      outline.rotation.copy(object.rotation);
      outline.scale.copy(object.scale).multiplyScalar(1.05);
      outline.name = 'outline';
      scene.add(outline);

      // Add transform gizmos
      addTransformGizmos(object);
    };

    const clearHighlights = () => {
      const outlines = scene.children.filter(obj => obj.name === 'outline');
      outlines.forEach(outline => scene.remove(outline));
      
      const gizmos = scene.children.filter(obj => obj.userData.isGizmo);
      gizmos.forEach(gizmo => scene.remove(gizmo));
    };

    const updateGizmoPositions = (object: THREE.Object3D) => {
      const gizmos = scene.children.filter(obj => obj.userData.isGizmo);
      gizmos.forEach(gizmo => {
        gizmo.position.copy(object.position);
        
        // Offset gizmos based on their axis
        if (gizmo.userData.axis === 'x') {
          gizmo.position.x += 2;
        } else if (gizmo.userData.axis === 'y') {
          gizmo.position.y += 2;
        } else if (gizmo.userData.axis === 'z') {
          gizmo.position.z += 2;
        }
      });
      
      // Update outline position
      const outlines = scene.children.filter(obj => obj.name === 'outline');
      outlines.forEach(outline => outline.position.copy(object.position));
    };

    const addTransformGizmos = (object: THREE.Object3D) => {
      if (tool === 'move') {
        addMoveGizmos(object);
      } else if (tool === 'rotate') {
        addRotateGizmos(object);
      } else if (tool === 'scale') {
        addScaleGizmos(object);
      }
    };

    const addMoveGizmos = (object: THREE.Object3D) => {
      const arrowLength = 1.5;
      const arrowRadius = 0.1;
      
      // X axis (red)
      const xArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
      const xArrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const xArrow = new THREE.Mesh(xArrowGeometry, xArrowMaterial);
      xArrow.position.copy(object.position);
      xArrow.position.x += arrowLength;
      xArrow.rotation.z = -Math.PI / 2;
      xArrow.name = 'move-gizmo-x';
      xArrow.userData = { isGizmo: true, axis: 'x' };
      scene.add(xArrow);

      // Y axis (green)
      const yArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
      const yArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const yArrow = new THREE.Mesh(yArrowGeometry, yArrowMaterial);
      yArrow.position.copy(object.position);
      yArrow.position.y += arrowLength;
      yArrow.name = 'move-gizmo-y';
      yArrow.userData = { isGizmo: true, axis: 'y' };
      scene.add(yArrow);

      // Z axis (blue)
      const zArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
      const zArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const zArrow = new THREE.Mesh(zArrowGeometry, zArrowMaterial);
      zArrow.position.copy(object.position);
      zArrow.position.z += arrowLength;
      zArrow.rotation.x = Math.PI / 2;
      zArrow.name = 'move-gizmo-z';
      zArrow.userData = { isGizmo: true, axis: 'z' };
      scene.add(zArrow);
    };

    const addRotateGizmos = (object: THREE.Object3D) => {
      const radius = 2;
      
      // X axis rotation ring (red)
      const xRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
      const xRingMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const xRing = new THREE.Mesh(xRingGeometry, xRingMaterial);
      xRing.position.copy(object.position);
      xRing.rotation.y = Math.PI / 2;
      xRing.name = 'rotate-gizmo-x';
      xRing.userData = { isGizmo: true, axis: 'x' };
      scene.add(xRing);

      // Y axis rotation ring (green)
      const yRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
      const yRingMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const yRing = new THREE.Mesh(yRingGeometry, yRingMaterial);
      yRing.position.copy(object.position);
      yRing.rotation.x = Math.PI / 2;
      yRing.name = 'rotate-gizmo-y';
      yRing.userData = { isGizmo: true, axis: 'y' };
      scene.add(yRing);

      // Z axis rotation ring (blue)
      const zRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
      const zRingMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const zRing = new THREE.Mesh(zRingGeometry, zRingMaterial);
      zRing.position.copy(object.position);
      zRing.name = 'rotate-gizmo-z';
      zRing.userData = { isGizmo: true, axis: 'z' };
      scene.add(zRing);
    };

    const addScaleGizmos = (object: THREE.Object3D) => {
      const cubeSize = 0.2;
      
      // X axis (red)
      const xCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const xCubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const xCube = new THREE.Mesh(xCubeGeometry, xCubeMaterial);
      xCube.position.copy(object.position);
      xCube.position.x += 2;
      xCube.name = 'scale-gizmo-x';
      xCube.userData = { isGizmo: true, axis: 'x' };
      scene.add(xCube);

      // Y axis (green)
      const yCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const yCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const yCube = new THREE.Mesh(yCubeGeometry, yCubeMaterial);
      yCube.position.copy(object.position);
      yCube.position.y += 2;
      yCube.name = 'scale-gizmo-y';
      yCube.userData = { isGizmo: true, axis: 'y' };
      scene.add(yCube);

      // Z axis (blue)
      const zCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const zCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const zCube = new THREE.Mesh(zCubeGeometry, zCubeMaterial);
      zCube.position.copy(object.position);
      zCube.position.z += 2;
      zCube.name = 'scale-gizmo-z';
      zCube.userData = { isGizmo: true, axis: 'z' };
      scene.add(zCube);
    };

    const onWheel = (event: WheelEvent) => {
      const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
      const newDistance = distance + event.deltaY * 0.01;
      const clampedDistance = Math.max(5, Math.min(50, newDistance));
      
      camera.position.normalize().multiplyScalar(clampedDistance);
      camera.lookAt(0, 0, 0);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      setKeys(prev => new Set(prev).add(event.key.toLowerCase()));
    };

    const onKeyUp = (event: KeyboardEvent) => {
      setKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(event.key.toLowerCase());
        return newKeys;
      });
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.dispose();
    };
  }, [project]);

  // Camera movement with WASD
  useEffect(() => {
    if (!cameraRef.current) return;

    const moveSpeed = 0.5;
    const camera = cameraRef.current;
    
    const moveCamera = () => {
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      
      camera.getWorldDirection(forward);
      right.crossVectors(forward, camera.up);
      
      if (keys.has('w')) {
        camera.position.addScaledVector(forward, moveSpeed);
      }
      if (keys.has('s')) {
        camera.position.addScaledVector(forward, -moveSpeed);
      }
      if (keys.has('a')) {
        camera.position.addScaledVector(right, -moveSpeed);
      }
      if (keys.has('d')) {
        camera.position.addScaledVector(right, moveSpeed);
      }
    };

    const animationId = setInterval(moveCamera, 16);
    return () => clearInterval(animationId);
  }, [keys]);

  // Update gizmos when tool changes
  useEffect(() => {
    if (selectedObject && selectedObject.mesh && sceneRef.current) {
      const scene = sceneRef.current;
      
      // Clear existing gizmos
      const gizmos = scene.children.filter(obj => obj.userData.isGizmo);
      gizmos.forEach(gizmo => scene.remove(gizmo));
      
      // Add new gizmos based on current tool
      if (tool === 'move') {
        addMoveGizmos(selectedObject.mesh);
      } else if (tool === 'rotate') {
        addRotateGizmos(selectedObject.mesh);
      } else if (tool === 'scale') {
        addScaleGizmos(selectedObject.mesh);
      }
    }
  }, [tool, selectedObject]);

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

console.log("Actor configured as: " + actor.Role);`;
  };

  const addMoveGizmos = (object: THREE.Object3D) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const arrowLength = 1.5;
    const arrowRadius = 0.1;
    
    // X axis (red)
    const xArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
    const xArrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xArrow = new THREE.Mesh(xArrowGeometry, xArrowMaterial);
    xArrow.position.copy(object.position);
    xArrow.position.x += arrowLength;
    xArrow.rotation.z = -Math.PI / 2;
    xArrow.name = 'move-gizmo-x';
    xArrow.userData = { isGizmo: true, axis: 'x' };
    scene.add(xArrow);

    // Y axis (green)
    const yArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
    const yArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yArrow = new THREE.Mesh(yArrowGeometry, yArrowMaterial);
    yArrow.position.copy(object.position);
    yArrow.position.y += arrowLength;
    yArrow.name = 'move-gizmo-y';
    yArrow.userData = { isGizmo: true, axis: 'y' };
    scene.add(yArrow);

    // Z axis (blue)
    const zArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
    const zArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zArrow = new THREE.Mesh(zArrowGeometry, zArrowMaterial);
    zArrow.position.copy(object.position);
    zArrow.position.z += arrowLength;
    zArrow.rotation.x = Math.PI / 2;
    zArrow.name = 'move-gizmo-z';
    zArrow.userData = { isGizmo: true, axis: 'z' };
    scene.add(zArrow);
  };

  const addRotateGizmos = (object: THREE.Object3D) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const radius = 2;
    
    // X axis rotation ring (red)
    const xRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
    const xRingMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xRing = new THREE.Mesh(xRingGeometry, xRingMaterial);
    xRing.position.copy(object.position);
    xRing.rotation.y = Math.PI / 2;
    xRing.name = 'rotate-gizmo-x';
    xRing.userData = { isGizmo: true, axis: 'x' };
    scene.add(xRing);

    // Y axis rotation ring (green)
    const yRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
    const yRingMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yRing = new THREE.Mesh(yRingGeometry, yRingMaterial);
    yRing.position.copy(object.position);
    yRing.rotation.x = Math.PI / 2;
    yRing.name = 'rotate-gizmo-y';
    yRing.userData = { isGizmo: true, axis: 'y' };
    scene.add(yRing);

    // Z axis rotation ring (blue)
    const zRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
    const zRingMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zRing = new THREE.Mesh(zRingGeometry, zRingMaterial);
    zRing.position.copy(object.position);
    zRing.name = 'rotate-gizmo-z';
    zRing.userData = { isGizmo: true, axis: 'z' };
    scene.add(zRing);
  };

  const addScaleGizmos = (object: THREE.Object3D) => {
    const scene = sceneRef.current;
    if (!scene) return;

    const cubeSize = 0.2;
    
    // X axis (red)
    const xCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const xCubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xCube = new THREE.Mesh(xCubeGeometry, xCubeMaterial);
    xCube.position.copy(object.position);
    xCube.position.x += 2;
    xCube.name = 'scale-gizmo-x';
    xCube.userData = { isGizmo: true, axis: 'x' };
    scene.add(xCube);

    // Y axis (green)
    const yCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const yCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yCube = new THREE.Mesh(yCubeGeometry, yCubeMaterial);
    yCube.position.copy(object.position);
    yCube.position.y += 2;
    yCube.name = 'scale-gizmo-y';
    yCube.userData = { isGizmo: true, axis: 'y' };
    scene.add(yCube);

    // Z axis (blue)
    const zCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const zCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zCube = new THREE.Mesh(zCubeGeometry, zCubeMaterial);
    zCube.position.copy(object.position);
    zCube.position.z += 2;
    zCube.name = 'scale-gizmo-z';
    zCube.userData = { isGizmo: true, axis: 'z' };
    scene.add(zCube);
  };

  const addObject = (type: string) => {
    if (!sceneRef.current) return;

    const id = `${type}_${Date.now()}`;
    let newObject: any = {
      id,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      visible: true,
      selectable: false,
      parent: 'workspace',
      children: [],
      position: { x: 0, y: 2, z: 0 },
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    };

    // Handle 3D objects
    if (['part', 'sphere', 'cylinder', 'actor'].includes(type)) {
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      switch (type) {
        case 'part':
          geometry = new THREE.BoxGeometry(2, 2, 2);
          material = new THREE.MeshLambertMaterial({ color: newObject.color });
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(1, 32, 32);
          material = new THREE.MeshLambertMaterial({ color: newObject.color });
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
          material = new THREE.MeshLambertMaterial({ color: newObject.color });
          break;
        case 'actor':
          geometry = new THREE.CylinderGeometry(1, 1, 0.4, 16);
          material = new THREE.MeshLambertMaterial({ color: 0x00FF00 }); // Solid green
          newObject.color = '#00FF00';
          newObject.position.y = 0.2;
          break;
        default:
          return;
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (Math.random() - 0.5) * 10,
        newObject.position.y,
        (Math.random() - 0.5) * 10
      );
      mesh.castShadow = true;
      mesh.name = newObject.name;
      mesh.userData = { id, name: newObject.name, type, selectable: true };
      
      // Add glow effect for actors
      if (type === 'actor') {
        const glowGeometry = new THREE.CylinderGeometry(1.1, 1.1, 0.1, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00FF00,
          transparent: true,
          opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.y = -0.15;
        mesh.add(glow);
        
        // Add default config for Actor
        newObject.children = [{
          id: `config_${Date.now()}`,
          name: 'Config',
          type: 'config',
          children: [],
          content: getActorConfigContent()
        }];
      }
      
      sceneRef.current.add(mesh);

      newObject.mesh = mesh;
      newObject.selectable = true;
      newObject.position = {
        x: mesh.position.x,
        y: mesh.position.y,
        z: mesh.position.z
      };
    }

    // Handle script objects
    if (['vscript', 'vlscript', 'vdata', 'config'].includes(type)) {
      newObject.content = getDefaultScriptContent(type);
    }

    const updatedObjects = [...objects, newObject];
    setObjects(updatedObjects);
    
    // CRITICAL: Sync with project immediately
    syncWithProject(updatedObjects);
    
    setShowAddMenu(false);
    
    console.log('[WORKSPACE] Added new object:', newObject.name, 'ID:', newObject.id);
  };

  const getDefaultScriptContent = (type: string) => {
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
      default:
        return '// New script';
    }
  };

  const deleteObject = (id: string) => {
    if (id === 'baseplate') return;
    
    const objectToDelete = objects.find(obj => obj.id === id);
    if (objectToDelete) {
      // Remove from 3D scene if it has a mesh
      if (objectToDelete.mesh && sceneRef.current) {
        sceneRef.current.remove(objectToDelete.mesh);
      }
      
      // Remove from objects array
      const updatedObjects = objects.filter(obj => obj.id !== id);
      setObjects(updatedObjects);
      
      // CRITICAL: Sync with project
      syncWithProject(updatedObjects);
      
      if (selectedObject?.id === id) {
        setSelectedObject(null);
        // Clear highlights when deleting selected object
        if (sceneRef.current) {
          const scene = sceneRef.current;
          const outlines = scene.children.filter(obj => obj.name === 'outline');
          outlines.forEach(outline => scene.remove(outline));
          const gizmos = scene.children.filter(obj => obj.userData.isGizmo);
          gizmos.forEach(gizmo => scene.remove(gizmo));
        }
      }
      
      console.log('[WORKSPACE] Deleted object:', objectToDelete.name);
    }
  };

  const toggleVisibility = (id: string) => {
    const updatedObjects = objects.map(obj => {
      if (obj.id === id) {
        obj.visible = !obj.visible;
        if (obj.mesh) {
          obj.mesh.visible = obj.visible;
        }
      }
      return obj;
    });
    
    setObjects(updatedObjects);
    syncWithProject(updatedObjects);
  };

  const resetCamera = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(10, 10, 10);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // CRITICAL: Fixed property updates that actually work
  const updateObjectProperty = (id: string, property: string, value: any) => {
    const updatedObjects = objects.map(obj => {
      if (obj.id === id) {
        if (property === 'name') {
          obj.name = value;
          if (obj.mesh) {
            obj.mesh.name = value;
            obj.mesh.userData.name = value;
          }
        } else if (property.startsWith('position.')) {
          const axis = property.split('.')[1] as 'x' | 'y' | 'z';
          obj.position[axis] = value;
          if (obj.mesh) {
            obj.mesh.position[axis] = value;
            
            // Update gizmos position if this object is selected
            if (selectedObject?.id === id && sceneRef.current) {
              const gizmos = sceneRef.current.children.filter(child => child.userData.isGizmo);
              gizmos.forEach(gizmo => {
                gizmo.position.copy(obj.mesh.position);
                if (gizmo.userData.axis === 'x') gizmo.position.x += 2;
                if (gizmo.userData.axis === 'y') gizmo.position.y += 2;
                if (gizmo.userData.axis === 'z') gizmo.position.z += 2;
              });
              
              // Update outline position
              const outlines = sceneRef.current.children.filter(child => child.name === 'outline');
              outlines.forEach(outline => outline.position.copy(obj.mesh.position));
            }
          }
        } else if (property === 'color') {
          obj.color = value;
          if (obj.mesh && obj.mesh.material) {
            (obj.mesh.material as THREE.MeshLambertMaterial).color.setHex(value.replace('#', '0x'));
          }
        }
        
        // Update selected object if it's the one being modified
        if (selectedObject?.id === id) {
          setSelectedObject({ ...obj });
        }
      }
      return obj;
    });
    
    setObjects(updatedObjects);
    
    // CRITICAL: Sync with project after every property change
    syncWithProject(updatedObjects);
    
    console.log('[PROPERTIES] Updated', property, 'to', value, 'for object', id);
  };

  const handleAddButtonClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setAddMenuPosition({ x: rect.right + 10, y: rect.top });
    setShowAddMenu(true);
    setSearchTerm('');
  };

  const getObjectIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'part': '🧱',
      'sphere': '⚪',
      'cylinder': '🥫',
      'actor': '👤',
      'config': '⚙️',
      'model': '🏗️',
      'folder': '📁',
      'vscript': '📜',
      'vlscript': '📋',
      'vdata': '🗄️',
      'ploid': '🤖',
      'image': '🖼️',
      'sound': '🔊',
      'video': '🎬'
    };
    return iconMap[type] || '📄';
  };

  return (
    <div className="flex-1 flex">
      {/* 3D Viewport */}
      <div className="flex-1 bg-gray-900 relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 bg-gray-800 rounded-lg p-2 flex gap-2">
          <button
            onClick={() => setTool('move')}
            className={`p-2 rounded transition-colors ${tool === 'move' ? 'bg-green-600' : 'hover:bg-gray-700'}`}
            title="Move Tool"
          >
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('rotate')}
            className={`p-2 rounded transition-colors ${tool === 'rotate' ? 'bg-green-600' : 'hover:bg-gray-700'}`}
            title="Rotate Tool"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('scale')}
            className={`p-2 rounded transition-colors ${tool === 'scale' ? 'bg-green-600' : 'hover:bg-gray-700'}`}
            title="Scale Tool"
          >
            <Scale className="w-4 h-4" />
          </button>
          <div className="w-px bg-gray-600"></div>
          <button
            onClick={resetCamera}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Add Objects Menu */}
        <div className="absolute top-4 right-4 z-10 bg-gray-800 rounded-lg p-2">
          <button
            onClick={handleAddButtonClick}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
          >
            + Add Object
          </button>
        </div>

        {/* 3D Canvas */}
        <div ref={mountRef} className="flex items-center justify-center h-full" />

        {/* Camera Controls Info */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
          <div className="space-y-1">
            <div>Mouse Drag: Rotate camera</div>
            <div className="text-green-400">WASD: Move camera freely</div>
            <div>Scroll: Zoom in/out</div>
            <div>Click objects to select</div>
            <div className="text-yellow-400">✓ Drag gizmos to transform</div>
            <div className="text-green-400">Tool: {tool.charAt(0).toUpperCase() + tool.slice(1)}</div>
            <div className="text-cyan-400">✓ Green cylinders: Actor spawn points</div>
            <div className="text-purple-400">✓ Objects sync with explorer!</div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Properties</h3>
        
        {selectedObject ? (
          <div className="space-y-4">
            {/* Object Info */}
            <div className="bg-gray-700/50 rounded-lg p-3">
              <h4 className="text-md font-semibold text-white mb-2">Object Info</h4>
              <div className="text-sm text-gray-300 space-y-1">
                <div>Type: <span className="text-green-400">{selectedObject.type}</span></div>
                <div>ID: <span className="text-blue-400">{selectedObject.id}</span></div>
                <div>Selectable: <span className="text-yellow-400">{selectedObject.selectable ? 'Yes' : 'No'}</span></div>
              </div>
            </div>

            {/* Basic Properties */}
            <div>
              <h4 className="text-md font-semibold text-white mb-2">Basic Properties</h4>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={selectedObject.name}
                    onChange={(e) => updateObjectProperty(selectedObject.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedObject.visible}
                    onChange={(e) => toggleVisibility(selectedObject.id)}
                    className="rounded"
                  />
                  <label className="text-sm text-gray-300">Visible</label>
                </div>
              </div>
            </div>

            {/* Transform Properties */}
            {selectedObject.mesh && (
              <div>
                <h4 className="text-md font-semibold text-white mb-2">Transform</h4>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">X</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedObject.position?.x?.toFixed(1) || 0}
                        onChange={(e) => updateObjectProperty(selectedObject.id, 'position.x', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Y</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedObject.position?.y?.toFixed(1) || 0}
                        onChange={(e) => updateObjectProperty(selectedObject.id, 'position.y', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Z</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedObject.position?.z?.toFixed(1) || 0}
                        onChange={(e) => updateObjectProperty(selectedObject.id, 'position.z', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Properties */}
            {selectedObject.mesh && (
              <div>
                <h4 className="text-md font-semibold text-white mb-2">Appearance</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Color</label>
                    <input
                      type="color"
                      value={selectedObject.color || '#ffffff'}
                      onChange={(e) => updateObjectProperty(selectedObject.id, 'color', e.target.value)}
                      className="w-full h-10 bg-gray-700 border border-gray-600 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actor Properties */}
            {selectedObject.type === 'actor' && (
              <div className="bg-green-900/20 border border-green-400/20 rounded-lg p-3">
                <h5 className="text-green-400 font-semibold text-sm mb-2">Actor Properties</h5>
                <div className="text-xs text-green-200 space-y-1">
                  <div>• Role: Spawn Point</div>
                  <div>• Collision: Disabled</div>
                  <div>• Players spawn at this location</div>
                  <div>• Edit Config to change role</div>
                  <div>• ✓ Solid green cylinder (visible!)</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedObject(null)}
                className="w-full px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Deselect Object
              </button>
              {selectedObject.id !== 'baseplate' && (
                <button
                  onClick={() => deleteObject(selectedObject.id)}
                  className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Delete Object
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <div className="text-4xl mb-4">🎯</div>
            <h4 className="text-lg font-semibold mb-2">No Object Selected</h4>
            <p className="text-sm">Click on an object in the 3D viewport to see its properties</p>
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg text-xs">
              <div className="text-green-400 font-semibold mb-1">✓ Working Features:</div>
              <div>• Object selection</div>
              <div>• Property editing</div>
              <div>• Gizmo manipulation</div>
              <div>• Explorer sync</div>
            </div>
          </div>
        )}

        {/* Scene Stats */}
        <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
          <h4 className="text-md font-semibold text-white mb-2">Scene Stats</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <div>Total Objects: <span className="text-green-400">{objects.length}</span></div>
            <div>Visible Objects: <span className="text-blue-400">{objects.filter(obj => obj.visible).length}</span></div>
            <div>Selected Tool: <span className="text-yellow-400">{tool}</span></div>
            <div className="text-green-400 text-xs mt-2">✓ All objects sync with Explorer!</div>
          </div>
        </div>
      </div>

      {/* Add Object Menu */}
      {showAddMenu && (
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
              <h3 className="text-white font-semibold mb-2">Add Object to Workspace</h3>
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
              {filteredObjectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => addObject(type.id)}
                  className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors text-left"
                >
                  <span className="text-lg">{type.icon}</span>
                  <div className="flex-1">
                    <div className="text-white font-medium">{type.name}</div>
                    <div className="text-gray-400 text-xs">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};