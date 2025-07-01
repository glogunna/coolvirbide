import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Move, RotateCw, Scale, Trash2, Plus, Eye, EyeOff } from 'lucide-react';
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
  const [transformControls, setTransformControls] = useState<any>(null);

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
    baseplate.userData = { id: 'baseplate', name: 'Baseplate', type: '3dobject', selectable: false };
    scene.add(baseplate);

    // Initialize objects array
    const initialObjects = [
      { id: 'baseplate', name: 'Baseplate', type: '3dobject', mesh: baseplate, visible: true, selectable: false }
    ];

    // Add some example objects if it's a game project
    if (project.type === 'game3d') {
      // Add a cube
      const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
      const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(0, 1, 0);
      cube.castShadow = true;
      cube.name = 'Part';
      cube.userData = { id: 'part1', name: 'Part', type: '3dobject', selectable: true };
      scene.add(cube);

      // Add a sphere
      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x4ecdc4 });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(5, 1, 0);
      sphere.castShadow = true;
      sphere.name = 'Ball';
      sphere.userData = { id: 'ball1', name: 'Ball', type: '3dobject', selectable: true };
      scene.add(sphere);

      initialObjects.push(
        { id: 'part1', name: 'Part', type: '3dobject', mesh: cube, visible: true, selectable: true },
        { id: 'ball1', name: 'Ball', type: '3dobject', mesh: sphere, visible: true, selectable: true }
      );
    }

    setObjects(initialObjects);

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Mouse controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const selectableObjects = scene.children.filter(obj => obj.userData.selectable);
      const intersects = raycaster.intersectObjects(selectableObjects);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const objectData = initialObjects.find(obj => obj.id === clickedObject.userData.id);
        setSelectedObject(objectData);
        
        // Highlight selected object
        highlightObject(clickedObject);
      } else {
        setSelectedObject(null);
        clearHighlights();
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
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

      // Add transform gizmos based on current tool
      addTransformGizmos(object);
    };

    const clearHighlights = () => {
      const outlines = scene.children.filter(obj => obj.name === 'outline');
      outlines.forEach(outline => scene.remove(outline));
      
      const gizmos = scene.children.filter(obj => obj.name.includes('gizmo'));
      gizmos.forEach(gizmo => scene.remove(gizmo));
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
      scene.add(xArrow);

      // Y axis (green)
      const yArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
      const yArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const yArrow = new THREE.Mesh(yArrowGeometry, yArrowMaterial);
      yArrow.position.copy(object.position);
      yArrow.position.y += arrowLength;
      yArrow.name = 'move-gizmo-y';
      scene.add(yArrow);

      // Z axis (blue)
      const zArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
      const zArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const zArrow = new THREE.Mesh(zArrowGeometry, zArrowMaterial);
      zArrow.position.copy(object.position);
      zArrow.position.z += arrowLength;
      zArrow.rotation.x = Math.PI / 2;
      zArrow.name = 'move-gizmo-z';
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
      scene.add(xRing);

      // Y axis rotation ring (green)
      const yRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
      const yRingMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const yRing = new THREE.Mesh(yRingGeometry, yRingMaterial);
      yRing.position.copy(object.position);
      yRing.rotation.x = Math.PI / 2;
      yRing.name = 'rotate-gizmo-y';
      scene.add(yRing);

      // Z axis rotation ring (blue)
      const zRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
      const zRingMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const zRing = new THREE.Mesh(zRingGeometry, zRingMaterial);
      zRing.position.copy(object.position);
      zRing.name = 'rotate-gizmo-z';
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
      scene.add(xCube);

      // Y axis (green)
      const yCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const yCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const yCube = new THREE.Mesh(yCubeGeometry, yCubeMaterial);
      yCube.position.copy(object.position);
      yCube.position.y += 2;
      yCube.name = 'scale-gizmo-y';
      scene.add(yCube);

      // Z axis (blue)
      const zCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
      const zCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
      const zCube = new THREE.Mesh(zCubeGeometry, zCubeMaterial);
      zCube.position.copy(object.position);
      zCube.position.z += 2;
      zCube.name = 'scale-gizmo-z';
      scene.add(zCube);
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      // Rotate camera around the scene
      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta += deltaMove.x * 0.01;
      spherical.phi -= deltaMove.y * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
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

    // Camera movement with WASD
    const moveCamera = () => {
      const moveSpeed = 0.5;
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

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      moveCamera();
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
  }, [project, keys]);

  // Update gizmos when tool changes
  useEffect(() => {
    if (selectedObject && selectedObject.mesh) {
      const scene = sceneRef.current;
      if (scene) {
        // Clear existing gizmos
        const gizmos = scene.children.filter(obj => obj.name.includes('gizmo'));
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
    }
  }, [tool, selectedObject]);

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
    scene.add(xArrow);

    // Y axis (green)
    const yArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
    const yArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yArrow = new THREE.Mesh(yArrowGeometry, yArrowMaterial);
    yArrow.position.copy(object.position);
    yArrow.position.y += arrowLength;
    yArrow.name = 'move-gizmo-y';
    scene.add(yArrow);

    // Z axis (blue)
    const zArrowGeometry = new THREE.ConeGeometry(arrowRadius * 2, arrowLength * 0.3, 8);
    const zArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zArrow = new THREE.Mesh(zArrowGeometry, zArrowMaterial);
    zArrow.position.copy(object.position);
    zArrow.position.z += arrowLength;
    zArrow.rotation.x = Math.PI / 2;
    zArrow.name = 'move-gizmo-z';
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
    scene.add(xRing);

    // Y axis rotation ring (green)
    const yRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
    const yRingMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yRing = new THREE.Mesh(yRingGeometry, yRingMaterial);
    yRing.position.copy(object.position);
    yRing.rotation.x = Math.PI / 2;
    yRing.name = 'rotate-gizmo-y';
    scene.add(yRing);

    // Z axis rotation ring (blue)
    const zRingGeometry = new THREE.TorusGeometry(radius, 0.05, 8, 32);
    const zRingMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zRing = new THREE.Mesh(zRingGeometry, zRingMaterial);
    zRing.position.copy(object.position);
    zRing.name = 'rotate-gizmo-z';
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
    scene.add(xCube);

    // Y axis (green)
    const yCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const yCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yCube = new THREE.Mesh(yCubeGeometry, yCubeMaterial);
    yCube.position.copy(object.position);
    yCube.position.y += 2;
    yCube.name = 'scale-gizmo-y';
    scene.add(yCube);

    // Z axis (blue)
    const zCubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const zCubeMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zCube = new THREE.Mesh(zCubeGeometry, zCubeMaterial);
    zCube.position.copy(object.position);
    zCube.position.z += 2;
    zCube.name = 'scale-gizmo-z';
    scene.add(zCube);
  };

  const addObject = (type: string) => {
    if (!sceneRef.current) return;

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;
    let name: string;

    switch (type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(2, 2, 2);
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        name = 'Part';
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(1, 32, 32);
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        name = 'Ball';
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
        material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
        name = 'Cylinder';
        break;
      default:
        return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    const id = `${type}_${Date.now()}`;
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      2,
      (Math.random() - 0.5) * 10
    );
    mesh.castShadow = true;
    mesh.name = name;
    mesh.userData = { id, name, type: '3dobject', selectable: true };
    sceneRef.current.add(mesh);

    const newObject = { id, name, type: '3dobject', mesh, visible: true, selectable: true };
    setObjects(prev => [...prev, newObject]);
  };

  const deleteObject = (id: string) => {
    if (id === 'baseplate') return;
    
    const objectToDelete = objects.find(obj => obj.id === id);
    if (objectToDelete && sceneRef.current) {
      sceneRef.current.remove(objectToDelete.mesh);
      setObjects(prev => prev.filter(obj => obj.id !== id));
      if (selectedObject?.id === id) {
        setSelectedObject(null);
        // Clear highlights when deleting selected object
        const scene = sceneRef.current;
        const outlines = scene.children.filter(obj => obj.name === 'outline');
        outlines.forEach(outline => scene.remove(outline));
        const gizmos = scene.children.filter(obj => obj.name.includes('gizmo'));
        gizmos.forEach(gizmo => scene.remove(gizmo));
      }
    }
  };

  const toggleVisibility = (id: string) => {
    const obj = objects.find(o => o.id === id);
    if (obj) {
      obj.visible = !obj.visible;
      obj.mesh.visible = obj.visible;
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
    if (obj && obj.mesh) {
      if (property === 'name') {
        obj.name = value;
        obj.mesh.name = value;
        obj.mesh.userData.name = value;
      } else if (property.startsWith('position.')) {
        const axis = property.split('.')[1];
        obj.mesh.position[axis as 'x' | 'y' | 'z'] = value;
        
        // Update gizmos position if this object is selected
        if (selectedObject?.id === id && sceneRef.current) {
          const gizmos = sceneRef.current.children.filter(child => child.name.includes('gizmo'));
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
      setObjects([...objects]);
      if (selectedObject?.id === id) {
        setSelectedObject({ ...obj });
      }
    }
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
          <div className="flex gap-2">
            <button
              onClick={() => addObject('cube')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              + Cube
            </button>
            <button
              onClick={() => addObject('sphere')}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            >
              + Sphere
            </button>
            <button
              onClick={() => addObject('cylinder')}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm transition-colors"
            >
              + Cylinder
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <div ref={mountRef} className="flex items-center justify-center h-full" />

        {/* Camera Controls Info */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
          <div className="space-y-1">
            <div>Mouse Drag: Rotate camera</div>
            <div>WASD: Move camera</div>
            <div>Scroll: Zoom in/out</div>
            <div>Click objects to select</div>
            <div className="text-green-400">Tool: {tool.charAt(0).toUpperCase() + tool.slice(1)}</div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Workspace</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-semibold text-white mb-2">Scene Objects ({objects.length})</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedObject?.id === obj.id ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedObject(obj)}
                >
                  <span className="text-sm text-white">{obj.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(obj.id);
                      }}
                      className="p-1 hover:bg-gray-600 rounded"
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
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedObject && (
            <div>
              <h4 className="text-md font-semibold text-white mb-2">Properties</h4>
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
              </div>
            </div>
          )}

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
    </div>
  );
};