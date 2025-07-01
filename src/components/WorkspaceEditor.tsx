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
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [tool, setTool] = useState('move');

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
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
    scene.add(baseplate);

    // Add some example objects
    if (project.type === 'game3d') {
      // Add a cube
      const cubeGeometry = new THREE.BoxGeometry(2, 2, 2);
      const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b6b });
      const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
      cube.position.set(0, 1, 0);
      cube.castShadow = true;
      cube.name = 'Part';
      scene.add(cube);

      // Add a sphere
      const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);
      const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x4ecdc4 });
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(5, 1, 0);
      sphere.castShadow = true;
      sphere.name = 'Ball';
      scene.add(sphere);
    }

    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Controls (basic mouse interaction)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
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
      spherical.theta -= deltaMove.x * 0.01;
      spherical.phi += deltaMove.y * 0.01;
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

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onWheel);

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
      renderer.dispose();
    };
  }, [project]);

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
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      2,
      (Math.random() - 0.5) * 10
    );
    mesh.castShadow = true;
    mesh.name = name;
    sceneRef.current.add(mesh);
  };

  const resetCamera = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(10, 10, 10);
    cameraRef.current.lookAt(0, 0, 0);
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
            <div>Mouse: Rotate camera</div>
            <div>Scroll: Zoom in/out</div>
            <div>Click objects to select</div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Workspace</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-semibold text-white mb-2">Scene Objects</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <span className="text-sm">Baseplate</span>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-gray-600 rounded">
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                <span className="text-sm">Part</span>
                <div className="flex gap-1">
                  <button className="p-1 hover:bg-gray-600 rounded">
                    <Eye className="w-3 h-3" />
                  </button>
                  <button className="p-1 hover:bg-red-600 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
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
                    value={selectedObject.name || ''}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">X</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Y</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Z</label>
                    <input
                      type="number"
                      step="0.1"
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