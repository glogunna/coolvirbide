import React, { useRef, useEffect, useState } from 'react';
import { RotateCcw, Move, RotateCw, Scale, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

interface Workspace2DEditorProps {
  project: any;
}

export const Workspace2DEditor: React.FC<Workspace2DEditorProps> = ({ project }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [tool, setTool] = useState('move');
  const [objects, setObjects] = useState<any[]>([]);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Initialize default objects
    const defaultObjects = [
      {
        id: 'ground',
        name: 'Ground',
        type: 'rectangle',
        x: 0,
        y: 500,
        width: 800,
        height: 100,
        color: '#228B22',
        visible: true
      },
      {
        id: 'player-spawn',
        name: 'PlayerSpawn',
        type: 'rectangle',
        x: 100,
        y: 450,
        width: 30,
        height: 50,
        color: '#FF6B6B',
        visible: true
      }
    ];

    setObjects(defaultObjects);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    draw();
  }, [objects, camera, selectedObject]);

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply camera transform
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // Draw grid
    drawGrid(ctx);

    // Draw objects
    objects.forEach(obj => {
      if (!obj.visible) return;

      ctx.fillStyle = obj.color;
      
      if (selectedObject?.id === obj.id) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2;
      }

      switch (obj.type) {
        case 'rectangle':
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          if (selectedObject?.id === obj.id) {
            ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
          }
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(obj.x + obj.width/2, obj.y + obj.height/2, obj.width/2, 0, Math.PI * 2);
          ctx.fill();
          if (selectedObject?.id === obj.id) {
            ctx.stroke();
          }
          break;
      }
    });

    ctx.restore();
  };

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridSize = 50;
    const startX = Math.floor(camera.x / gridSize) * gridSize;
    const startY = Math.floor(camera.y / gridSize) * gridSize;

    for (let x = startX; x < camera.x + 800; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, camera.y);
      ctx.lineTo(x, camera.y + 600);
      ctx.stroke();
    }

    for (let y = startY; y < camera.y + 600; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(camera.x, y);
      ctx.lineTo(camera.x + 800, y);
      ctx.stroke();
    }
  };

  const addObject = (type: string) => {
    const newObject = {
      id: Date.now().toString(),
      name: type === 'rectangle' ? 'Part' : 'Circle',
      type,
      x: 200 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      width: type === 'rectangle' ? 50 : 40,
      height: type === 'rectangle' ? 50 : 40,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      visible: true
    };

    setObjects(prev => [...prev, newObject]);
  };

  const deleteObject = (id: string) => {
    setObjects(prev => prev.filter(obj => obj.id !== id));
    if (selectedObject?.id === id) {
      setSelectedObject(null);
    }
  };

  const toggleVisibility = (id: string) => {
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, visible: !obj.visible } : obj
    ));
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left + camera.x) / camera.zoom;
    const y = (e.clientY - rect.top + camera.y) / camera.zoom;

    // Find clicked object
    const clickedObject = objects.find(obj => 
      x >= obj.x && x <= obj.x + obj.width &&
      y >= obj.y && y <= obj.y + obj.height
    );

    setSelectedObject(clickedObject || null);
  };

  const resetCamera = () => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  };

  return (
    <div className="flex-1 flex">
      {/* 2D Viewport */}
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
              onClick={() => addObject('rectangle')}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              + Rectangle
            </button>
            <button
              onClick={() => addObject('circle')}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            >
              + Circle
            </button>
          </div>
        </div>

        {/* 2D Canvas */}
        <div className="flex items-center justify-center h-full">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="border border-gray-600 rounded-lg shadow-lg cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Camera Controls Info */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg text-sm">
          <div className="space-y-1">
            <div>Click: Select objects</div>
            <div>Drag: Move camera</div>
            <div>Scroll: Zoom in/out</div>
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">2D Workspace</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-md font-semibold text-white mb-2">Scene Objects</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {objects.map((obj) => (
                <div
                  key={obj.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                    selectedObject?.id === obj.id ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedObject(obj)}
                >
                  <span className="text-sm">{obj.name}</span>
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
                    {obj.id !== 'ground' && (
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
                    onChange={(e) => {
                      const newName = e.target.value;
                      setObjects(prev => prev.map(obj => 
                        obj.id === selectedObject.id ? { ...obj, name: newName } : obj
                      ));
                      setSelectedObject({ ...selectedObject, name: newName });
                    }}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">X</label>
                    <input
                      type="number"
                      value={selectedObject.x}
                      onChange={(e) => {
                        const newX = parseInt(e.target.value) || 0;
                        setObjects(prev => prev.map(obj => 
                          obj.id === selectedObject.id ? { ...obj, x: newX } : obj
                        ));
                        setSelectedObject({ ...selectedObject, x: newX });
                      }}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Y</label>
                    <input
                      type="number"
                      value={selectedObject.y}
                      onChange={(e) => {
                        const newY = parseInt(e.target.value) || 0;
                        setObjects(prev => prev.map(obj => 
                          obj.id === selectedObject.id ? { ...obj, y: newY } : obj
                        ));
                        setSelectedObject({ ...selectedObject, y: newY });
                      }}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Width</label>
                    <input
                      type="number"
                      value={selectedObject.width}
                      onChange={(e) => {
                        const newWidth = parseInt(e.target.value) || 1;
                        setObjects(prev => prev.map(obj => 
                          obj.id === selectedObject.id ? { ...obj, width: newWidth } : obj
                        ));
                        setSelectedObject({ ...selectedObject, width: newWidth });
                      }}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Height</label>
                    <input
                      type="number"
                      value={selectedObject.height}
                      onChange={(e) => {
                        const newHeight = parseInt(e.target.value) || 1;
                        setObjects(prev => prev.map(obj => 
                          obj.id === selectedObject.id ? { ...obj, height: newHeight } : obj
                        ));
                        setSelectedObject({ ...selectedObject, height: newHeight });
                      }}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Color</label>
                  <input
                    type="color"
                    value={selectedObject.color}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      setObjects(prev => prev.map(obj => 
                        obj.id === selectedObject.id ? { ...obj, color: newColor } : obj
                      ));
                      setSelectedObject({ ...selectedObject, color: newColor });
                    }}
                    className="w-full h-10 bg-gray-700 border border-gray-600 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-md font-semibold text-white mb-2">Camera</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">X</label>
                  <input
                    type="number"
                    value={camera.x}
                    onChange={(e) => setCamera(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Y</label>
                  <input
                    type="number"
                    value={camera.y}
                    onChange={(e) => setCamera(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Zoom</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={camera.zoom}
                  onChange={(e) => setCamera(prev => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-xs text-gray-400">{camera.zoom.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};