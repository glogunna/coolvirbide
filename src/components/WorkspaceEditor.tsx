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
  const [dragStartPosition, setDragStartPosition] = useState<THREE.Vector3 | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuPosition, setAddMenuPosition] = useState({ x: 0, y: 0 });
  const [addMenuParent, setAddMenuParent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);

  const objectTypes = [
    { id: 'part', name: 'Part', icon: '🧱', description: '3D part/block' },
    { id: 'sphere', name: 'Sphere', icon: '⚪', description: '3D sphere' },
    { id: 'cylinder', name: 'Cylinder', icon: '🥫', description: '3D cylinder' },
    { id: 'actor', name: 'Actor', icon: '👤', description: 'Interactive game actor with configurable role' },
    { id: 'model', name: 'Model', icon: '🏗️', description: 'Container for 3D objects' },
    { id: 'folder', name: 'Folder', icon: '📁', description: 'Organize objects in folders' }
  ];

  const filteredObjectTypes = objectTypes.filter(type => 
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    type.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CRITICAL: Listen for explorer selection events
  useEffect(() => {
    const handleExplorerSelection = (event: CustomEvent) => {
      const objectId = event.detail.objectId;
      console.log('[WORKSPACE] Explorer selected object:', objectId);
      
      // Find the object in the scene
      if (sceneRef.current) {
        const sceneObject = sceneRef.current.children.find(child => 
          child.userData.id === objectId
        );
        
        if (sceneObject) {
          console.log('[WORKSPACE] Found scene object, highlighting:', sceneObject.name);
          
          // Find the corresponding object data
          const objectData = objects.find(obj => obj.id === objectId);
          if (objectData) {
            setSelectedObject(objectData);
            highlightObject(sceneObject);
          }
        }
      }
    };

    window.addEventListener('explorerObjectSelected', handleExplorerSelection as EventListener);
    
    return () => {
      window.removeEventListener('explorerObjectSelected', handleExplorerSelection as EventListener);
    };
  }, [objects]);

  // CRITICAL: Sync with project workspace objects for live updates
  useEffect(() => {
    console.log('[WORKSPACE] Project workspace objects changed, syncing...');
    loadWorkspaceObjectsFromProject();
  }, [project.services.workspace.objects]);

  const loadWorkspaceObjectsFromProject = () => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    
    // Clear existing workspace objects (but keep baseplate and grid)
    const objectsToRemove = scene.children.filter(child => 
      child.userData.id && child.userData.id !== 'baseplate' && !child.userData.isGizmo && child.name !== 'outline'
    );
    objectsToRemove.forEach(obj => scene.remove(obj));

    // Load objects from project
    const workspaceObjects = project.services.workspace.objects || [];
    const newObjects: any[] = [];

    const loadObjectsRecursively = (objects: any[], parent?: THREE.Object3D) => {
      for (const obj of objects) {
        if (obj.type === 'config') continue; // Skip config objects

        console.log('[WORKSPACE] Loading object from project:', obj.name, 'type:', obj.type);
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
            break;

          case 'actor':
            const config = obj.children?.find((child: any) => child.type === 'config');
            const isSpawnPoint = config && config.content && config.content.includes('Role = "SpawnPoint"');
            
            if (isSpawnPoint) {
              const spawnGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
              const spawnMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x00FF00,
                transparent: true,
                opacity: 0.7
              });
              mesh = new THREE.Mesh(spawnGeometry, spawnMaterial);
              
              const glowGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
              const glowMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x00FF00,
                transparent: true,
                opacity: 0.3
              });
              const glow = new THREE.Mesh(glowGeometry, glowMaterial);
              mesh.add(glow);
            } else {
              const actorGeometry = new THREE.BoxGeometry(1, 2, 1);
              const actorMaterial = new THREE.MeshLambertMaterial({ color: 0x9B59B6 });
              mesh = new THREE.Mesh(actorGeometry, actorMaterial);
              mesh.castShadow = true;
              mesh.receiveShadow = true;
            }
            break;

          case 'model':
          case 'folder':
            mesh = new THREE.Group();
            break;
        }

        if (mesh) {
          if (obj.position) {
            mesh.position.set(
              obj.position.x || 0, 
              obj.position.y || (obj.type === 'actor' ? 0.1 : 2), 
              obj.position.z || 0
            );
          } else {
            mesh.position.set(0, obj.type === 'actor' ? 0.1 : 2, 0);
          }
          
          if (obj.rotation) {
            mesh.rotation.set(obj.rotation.x || 0, obj.rotation.y || 0, obj.rotation.z || 0);
          }
          if (obj.scale && obj.type !== 'part' && obj.type !== 'sphere' && obj.type !== 'cylinder') {
            mesh.scale.set(obj.scale.x || 1, obj.scale.y || 1, obj.scale.z || 1);
          }

          mesh.name = obj.name;
          mesh.userData = { id: obj.id, type: obj.type, selectable: true };

          if (parent) {
            parent.add(mesh);
          } else {
            scene.add(mesh);
          }

          // Create object data
          const objectData = {
            id: obj.id,
            name: obj.name,
            type: obj.type,
            mesh: mesh,
            visible: true,
            selectable: true,
            parent: 'workspace',
            children: obj.children || []
          };

          newObjects.push(objectData);

          if (obj.children && obj.children.length > 0) {
            loadObjectsRecursively(obj.children, mesh);
          }
        }
      }
    };

    // Add baseplate to objects if not already there
    const baseplate = scene.children.find(child => child.userData.id === 'baseplate');
    if (baseplate) {
      newObjects.push({
        id: 'baseplate',
        name: 'Baseplate',
        type: 'part',
        mesh: baseplate,
        visible: true,
        selectable: true,
        parent: 'workspace',
        children: []
      });
    }

    loadObjectsRecursively(workspaceObjects);
    setObjects(newObjects);

    console.log('[WORKSPACE] Loaded', newObjects.length, 'objects from project');
  };

  const highlightObject = (object: THREE.Object3D) => {
    if (!sceneRef.current) return;
    
    clearHighlights();
    
    // Create outline effect
    const outlineGeometry = (object as THREE.Mesh).geometry?.clone();
    if (outlineGeometry) {
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
      sceneRef.current.add(outline);
    }

    // Add transform gizmos based on current tool
    addTransformGizmos(object);
  };

  const clearHighlights = () => {
    if (!sceneRef.current) return;
    
    const outlines = sceneRef.current.children.filter(obj => obj.name === 'outline');
    outlines.forEach(outline => sceneRef.current!.remove(outline));
    
    const gizmos = sceneRef.current.children.filter(obj => obj.userData.isGizmo);
    gizmos.forEach(gizmo => sceneRef.current!.remove(gizmo));
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

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Load initial objects from project
    loadWorkspaceObjectsFromProject();

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragPlane: THREE.Plane | null = null;
    let dragOffset = new THREE.Vector3();

    const onMouseDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      
      // Check for gizmo interaction first
      const gizmos = scene.children.filter(obj => obj.userData.isGizmo);
      const gizmoIntersects = raycaster.intersectObjects(gizmos);
      
      if (gizmoIntersects.length > 0 && selectedObject) {
        // Start gizmo interaction
        setIsDraggingGizmo(true);
        
        // Create drag plane based on gizmo axis
        const gizmo = gizmoIntersects[0].object;
        const axis = gizmo.userData.axis;
        
        if (axis === 'x') {
          dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        } else if (axis === 'y') {
          dragPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        } else if (axis === 'z') {
          dragPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
        }
        
        // Calculate offset from object center to mouse position
        const intersection = new THREE.Vector3();
        if (dragPlane) {
          raycaster.ray.intersectPlane(dragPlane, intersection);
          dragOffset.subVectors(selectedObject.mesh.position, intersection);
        }
        
        return;
      }

      // Check for object selection
      const selectableObjects = scene.children.filter(obj => obj.userData.selectable && !obj.userData.isGizmo);
      const intersects = raycaster.intersectObjects(selectableObjects);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const objectData = objects.find(obj => obj.id === clickedObject.userData.id);
        if (objectData) {
          setSelectedObject(objectData);
          highlightObject(clickedObject);
        }
      } else {
        setSelectedObject(null);
        clearHighlights();
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isDraggingGizmo && selectedObject && dragPlane) {
        // Handle gizmo dragging with proper plane intersection
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        
        const intersection = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(dragPlane, intersection)) {
          const newPosition = intersection.add(dragOffset);
          
          if (tool === 'move') {
            selectedObject.mesh.position.copy(newPosition);
            selectedObject.mesh.position.y = Math.max(selectedObject.mesh.position.y, 0.5);
            updateGizmoPositions(selectedObject.mesh);
            
            // CRITICAL: Update project data immediately for live sync
            updateProjectObjectPosition(selectedObject.id, selectedObject.mesh.position);
          }
        }
        return;
      }

      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      // Rotate camera around the scene
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
      setIsDraggingGizmo(false);
      dragPlane = null;
      dragOffset.set(0, 0, 0);
    };

    const updateGizmoPositions = (object: THREE.Object3D) => {
      const gizmos = scene.children.filter(obj => obj.userData.isGizmo);
      gizmos.forEach(gizmo => {
        const basePosition = object.position.clone();
        gizmo.position.copy(basePosition);
        
        if (gizmo.name.includes('x')) gizmo.position.x += 2;
        if (gizmo.name.includes('y')) gizmo.position.y += 2;
        if (gizmo.name.includes('z')) gizmo.position.z += 2;
      });
      
      // Update outline position
      const outlines = scene.children.filter(obj => obj.name === 'outline');
      outlines.forEach(outline => outline.position.copy(object.position));
    };

    const onWheel = (event: WheelEvent) => {
      const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));
      const newDistance = distance + event.deltaY * 0.01;
      const clampedDistance = Math.max(5, Math.min(50, newDistance));
      
      camera.position.normalize().multiplyScalar(clampedDistance);
      camera.lookAt(0, 0, 0);
    };

    // Keyboard controls for WASD movement
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

  // FIXED: Camera movement with WASD - moved outside useEffect to prevent teleporting
  useEffect(() => {
    if (!cameraRef.current) return;

    const moveSpeed = 0.5;
    const camera = cameraRef.current;
    
    const moveCamera = () => {
      const forward = new THREE.Vector3();
      const right = new THREE.Vector3();
      
      camera.getWorldDirection(forward);
      right.crossVectors(forward, camera.up);
      
      let moved = false;
      
      if (keys.has('w')) {
        camera.position.addScaledVector(forward, moveSpeed);
        moved = true;
      }
      if (keys.has('s')) {
        camera.position.addScaledVector(forward, -moveSpeed);
        moved = true;
      }
      if (keys.has('a')) {
        camera.position.addScaledVector(right, -moveSpeed);
        moved = true;
      }
      if (keys.has('d')) {
        camera.position.addScaledVector(right, moveSpeed);
        moved = true;
      }
    };

    const animationId = setInterval(moveCamera, 16); // ~60fps
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

    const arrowLength = 2;
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

  const addObject = (type: string, parentId?: string) => {
    if (!sceneRef.current) return;

    const id = `${type}_${Date.now()}`;
    let newObject: any = {
      id,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type,
      visible: true,
      selectable: false,
      parent: parentId || 'workspace',
      children: []
    };

    // Handle 3D objects
    if (['part', 'sphere', 'cylinder', 'actor'].includes(type)) {
      let geometry: THREE.BufferGeometry;
      let material: THREE.Material;

      switch (type) {
        case 'part':
          geometry = new THREE.BoxGeometry(2, 2, 2);
          material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
          break;
        case 'sphere':
          geometry = new THREE.SphereGeometry(1, 32, 32);
          material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
          break;
        case 'cylinder':
          geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
          material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
          break;
        case 'actor':
          geometry = new THREE.CylinderGeometry(1, 1, 0.2, 16);
          material = new THREE.MeshLambertMaterial({ 
            color: 0x00FF00,
            transparent: true,
            opacity: 0.7
          });
          break;
        default:
          return;
      }

      const mesh = new THREE.Mesh(geometry, material);
      const position = {
        x: (Math.random() - 0.5) * 10,
        y: type === 'actor' ? 0.1 : 2,
        z: (Math.random() - 0.5) * 10
      };
      
      mesh.position.set(position.x, position.y, position.z);
      mesh.castShadow = true;
      mesh.name = newObject.name;
      mesh.userData = { id, name: newObject.name, type, selectable: true };
      
      // Add glow effect for actors
      if (type === 'actor') {
        const glowGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00FF00,
          transparent: true,
          opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
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
      newObject.position = position;
    }

    setObjects(prev => [...prev, newObject]);
    
    // CRITICAL: Update project data immediately for live sync
    updateProjectWithNewObject(newObject);
    
    setShowAddMenu(false);
  };

  // CRITICAL: Function to update project data when objects are added/modified
  const updateProjectWithNewObject = (newObject: any) => {
    const workspaceObjects = [...(project.services.workspace.objects || [])];
    
    // Add the new object to workspace
    const projectObject = {
      id: newObject.id,
      name: newObject.name,
      type: newObject.type,
      position: newObject.position,
      children: newObject.children || []
    };
    
    workspaceObjects.push(projectObject);
    project.services.workspace.objects = workspaceObjects;
    
    console.log('[WORKSPACE] Added object to project:', projectObject);
    
    // Notify file explorer to update
    if (window.updateFileExplorer) {
      window.updateFileExplorer();
    }
  };

  // CRITICAL: Function to update object position in project data
  const updateProjectObjectPosition = (objectId: string, position: THREE.Vector3) => {
    const workspaceObjects = project.services.workspace.objects || [];
    
    const updateObjectRecursively = (objects: any[]): boolean => {
      for (const obj of objects) {
        if (obj.id === objectId) {
          obj.position = { x: position.x, y: position.y, z: position.z };
          return true;
        }
        if (obj.children && updateObjectRecursively(obj.children)) {
          return true;
        }
      }
      return false;
    };
    
    updateObjectRecursively(workspaceObjects);
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
      setObjects(prev => prev.filter(obj => obj.id !== id));
      
      // CRITICAL: Update project data immediately
      const workspaceObjects = project.services.workspace.objects || [];
      const removeObjectRecursively = (objects: any[]): any[] => {
        return objects.filter(obj => {
          if (obj.id === id) {
            return false;
          }
          if (obj.children) {
            obj.children = removeObjectRecursively(obj.children);
          }
          return true;
        });
      };
      
      project.services.workspace.objects = removeObjectRecursively(workspaceObjects);
      
      // Notify file explorer to update
      if (window.updateFileExplorer) {
        window.updateFileExplorer();
      }
      
      if (selectedObject?.id === id) {
        setSelectedObject(null);
        clearHighlights();
      }
    }
  };

  const toggleVisibility = (id: string) => {
    const obj = objects.find(o => o.id === id);
    if (obj) {
      obj.visible = !obj.visible;
      if (obj.mesh) {
        obj.mesh.visible = obj.visible;
      }
      setObjects([...objects]);
    }
  };

  const resetCamera = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(10, 10, 10);
    cameraRef.current.lookAt(0, 0, 0);
  };

  const updateObjectProperty = (id: string, property: string, value: any) => {
    const obj = objects.find(o => o.id === id);
    if (obj) {
      if (property === 'name') {
        obj.name = value;
        if (obj.mesh) {
          obj.mesh.name = value;
          obj.mesh.userData.name = value;
        }
      } else if (property.startsWith('position.')) {
        const axis = property.split('.')[1];
        if (obj.mesh) {
          obj.mesh.position[axis as 'x' | 'y' | 'z'] = value;
          
          // CRITICAL: Update project data immediately
          updateProjectObjectPosition(obj.id, obj.mesh.position);
          
          // Update gizmos position if this object is selected
          if (selectedObject?.id === id && sceneRef.current) {
            const gizmos = sceneRef.current.children.filter(child => child.userData.isGizmo);
            gizmos.forEach(gizmo => {
              gizmo.position.copy(obj.mesh.position);
              if (gizmo.name.includes('x')) gizmo.position.x += 2;
              if (gizmo.name.includes('y')) gizmo.position.y += 2;
              if (gizmo.name.includes('z')) gizmo.position.z += 2;
            });
            
            // Update outline position
            const outlines = sceneRef.current.children.filter(child => child.name === 'outline');
            outlines.forEach(outline => outline.position.copy(obj.mesh.position));
          }
        }
      }
      setObjects([...objects]);
      if (selectedObject?.id === id) {
        setSelectedObject({ ...obj });
      }
    }
  };

  const handleAddButtonClick = (event: React.MouseEvent, parentId?: string) => {
    event.stopPropagation();
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setAddMenuPosition({ x: rect.right + 10, y: rect.top });
    setAddMenuParent(parentId ? objects.find(obj => obj.id === parentId) : null);
    setShowAddMenu(true);
    setSearchTerm('');
  };

  const renderObjectHierarchy = (obj: any, depth = 0) => {
    const hasChildren = obj.children && obj.children.length > 0;
    const isSelected = selectedObject?.id === obj.id;

    return (
      <div key={obj.id}>
        <div
          className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group ${
            isSelected ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => obj.selectable && setSelectedObject(obj)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">{getObjectIcon(obj.type)}</span>
            {editingName === obj.id ? (
              <input
                type="text"
                value={obj.name}
                onChange={(e) => updateObjectProperty(obj.id, 'name', e.target.value)}
                onBlur={() => setEditingName(null)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingName(null);
                }}
                className="flex-1 px-1 py-0.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                autoFocus
              />
            ) : (
              <span className="text-sm text-white truncate">{obj.name}</span>
            )}
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleAddButtonClick(e, obj.id)}
              className="p-1 hover:bg-gray-500 rounded"
              title="Add Object"
            >
              <Plus className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingName(obj.id);
              }}
              className="p-1 hover:bg-gray-500 rounded"
              title="Rename"
            >
              <Edit2 className="w-3 h-3 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleVisibility(obj.id);
              }}
              className="p-1 hover:bg-gray-500 rounded"
              title="Toggle Visibility"
            >
              {obj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            {obj.id !== 'baseplate' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteObject(obj.id);
                }}
                className="p-1 hover:bg-red-600 rounded"
                title="Delete"
              >
                <Trash2 className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {hasChildren && obj.children.map((child: any) => renderObjectHierarchy(child, depth + 1))}
      </div>
    );
  };

  const getObjectIcon = (type: string) => {
    const iconMap: { [key: string]: string } = {
      'part': '🧱',
      'sphere': '⚪',
      'cylinder': '🥫',
      'actor': '👤',
      'config': '⚙️',
      'model': '🏗️',
      'folder': '📁'
    };
    return iconMap[type] || '📄';
  };

  // Get root objects (those with parent 'workspace' or no parent)
  const rootObjects = objects.filter(obj => obj.parent === 'workspace' || !obj.parent);

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
            onClick={(e) => handleAddButtonClick(e)}
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
            <div className="text-yellow-400">Drag gizmos to transform</div>
            <div className="text-green-400">Tool: {tool.charAt(0).toUpperCase() + tool.slice(1)}</div>
            <div className="text-cyan-400">Green cylinders: Actor spawn points</div>
            <div className="text-purple-400">✓ Live sync with Explorer!</div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Properties</h3>
        
        <div className="space-y-4">
          {selectedObject ? (
            <div>
              <h4 className="text-md font-semibold text-white mb-2">Selected Object</h4>
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
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Type</label>
                  <div className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-400 text-sm">
                    {selectedObject.type}
                  </div>
                </div>
                {selectedObject.mesh && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">X</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedObject.mesh?.position.x.toFixed(1) || 0}
                        onChange={(e) => updateObjectProperty(selectedObject.id, 'position.x', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Y</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedObject.mesh?.position.y.toFixed(1) || 0}
                        onChange={(e) => updateObjectProperty(selectedObject.id, 'position.y', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Z</label>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedObject.mesh?.position.z.toFixed(1) || 0}
                        onChange={(e) => updateObjectProperty(selectedObject.id, 'position.z', parseFloat(e.target.value))}
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>
                  </div>
                )}
                {selectedObject.type === 'actor' && (
                  <div className="mt-3 p-3 bg-green-900/20 border border-green-400/20 rounded-lg">
                    <h5 className="text-green-400 font-semibold text-sm mb-2">Actor Properties</h5>
                    <div className="text-xs text-green-200 space-y-1">
                      <div>• Role: Spawn Point</div>
                      <div>• Collision: Disabled</div>
                      <div>• Players spawn at this location</div>
                      <div>• Edit Config to change role</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-2">🎯</div>
              <p>Select an object to view properties</p>
              <p className="text-sm mt-2">Click objects in the 3D view or Explorer</p>
            </div>
          )}

          <div>
            <h4 className="text-md font-semibold text-white mb-2">Scene Objects ({objects.length})</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {rootObjects.map((obj) => renderObjectHierarchy(obj))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-white mb-2">Lighting</h4>
            <div className="space-y-2">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Ambient</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  defaultValue="0.6"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Directional</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  defaultValue="0.8"
                  className="w-full"
                />
              </div>
            </div>
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
              <h3 className="text-white font-semibold mb-2">
                Add Object {addMenuParent && `to ${addMenuParent.name}`}
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
              {filteredObjectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => addObject(type.id, addMenuParent?.id)}
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