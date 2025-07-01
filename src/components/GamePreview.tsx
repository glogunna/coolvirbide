import React, { useRef, useEffect, useState } from 'react';
import { Play, Square, RotateCcw, Settings, Maximize } from 'lucide-react';

interface GamePreviewProps {
  project: any;
}

export const GamePreview: React.FC<GamePreviewProps> = ({ project }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [gameStats, setGameStats] = useState({
    fps: 60,
    objects: 0,
    memory: '12.5MB'
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Initialize game based on project type
    if (project.type === 'game3d') {
      render3DGame(ctx);
    } else if (project.type === 'game2d') {
      render2DGame(ctx);
    } else {
      renderWebApp(ctx);
    }

    // Update stats
    setGameStats({
      fps: 60,
      objects: project.type.includes('game') ? 5 : 0,
      memory: project.type === 'game3d' ? '24.8MB' : project.type === 'game2d' ? '8.2MB' : '4.1MB'
    });
  }, [project]);

  const render3DGame = (ctx: CanvasRenderingContext2D) => {
    // Clear canvas
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(0, 0, 800, 600);

    // Draw ground
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, 400, 800, 200);

    // Draw 3D-looking terrain
    ctx.fillStyle = '#32CD32';
    for (let i = 0; i < 10; i++) {
      const x = i * 80;
      const height = Math.sin(i * 0.5) * 50 + 50;
      ctx.fillRect(x, 400 - height, 80, height);
    }

    // Draw player character (3D cube)
    ctx.save();
    ctx.translate(400, 350);
    
    // Cube faces
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(-20, -40, 40, 40); // Front face
    
    ctx.fillStyle = '#FF5252';
    ctx.beginPath();
    ctx.moveTo(20, -40);
    ctx.lineTo(30, -50);
    ctx.lineTo(30, -10);
    ctx.lineTo(20, 0);
    ctx.closePath();
    ctx.fill(); // Right face
    
    ctx.fillStyle = '#FF8A80';
    ctx.beginPath();
    ctx.moveTo(-20, -40);
    ctx.lineTo(-10, -50);
    ctx.lineTo(30, -50);
    ctx.lineTo(20, -40);
    ctx.closePath();
    ctx.fill(); // Top face
    
    ctx.restore();

    // Draw UI overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 80);
    ctx.fillStyle = '#10B981';
    ctx.font = '16px monospace';
    ctx.fillText('3D Game Running', 20, 30);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.fillText('WASD: Move', 20, 50);
    ctx.fillText('Mouse: Look around', 20, 65);
    ctx.fillText('Space: Jump', 20, 80);

    // Health bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 550, 120, 30);
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(15, 555, 110, 20);
    ctx.fillStyle = '#44FF44';
    ctx.fillRect(15, 555, 88, 20); // 80% health
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px monospace';
    ctx.fillText('Health: 80%', 20, 568);
  };

  const render2DGame = (ctx: CanvasRenderingContext2D) => {
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

  const renderWebApp = (ctx: CanvasRenderingContext2D) => {
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
    // Trigger re-render
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        if (project.type === 'game3d') {
          render3DGame(ctx);
        } else if (project.type === 'game2d') {
          render2DGame(ctx);
        } else {
          renderWebApp(ctx);
        }
      }
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
            <span>Memory: {gameStats.memory}</span>
          </div>
          <button
            onClick={resetGame}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Reset"
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
      <div className={`flex-1 flex items-center justify-center p-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={`border border-gray-600 rounded-lg shadow-lg ${isFullscreen ? 'w-full h-full' : ''}`}
            style={{ 
              imageRendering: 'pixelated',
              maxWidth: isFullscreen ? '100vw' : '800px',
              maxHeight: isFullscreen ? '100vh' : '600px'
            }}
          />
          
          {/* Game Controls Overlay */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
            <div className="text-sm space-y-1">
              {project.type === 'game3d' && (
                <>
                  <div>WASD: Move</div>
                  <div>Mouse: Look</div>
                  <div>Space: Jump</div>
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
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="bg-gray-800 border-t border-gray-700 p-4 h-32 overflow-auto">
        <div className="text-sm font-mono text-gray-300 space-y-1">
          <div className="text-green-400">[INFO] Game initialized successfully</div>
          <div className="text-blue-400">[DEBUG] Loading {project.type} environment...</div>
          <div className="text-green-400">[INFO] All assets loaded</div>
          <div className="text-yellow-400">[WARN] Performance monitoring active</div>
          <div className="text-green-400">[INFO] Game loop started at 60 FPS</div>
          {project.type.includes('game') && (
            <div className="text-blue-400">[DEBUG] Physics engine initialized</div>
          )}
          {project.type === 'webapp' && (
            <div className="text-blue-400">[DEBUG] API endpoints registered</div>
          )}
        </div>
      </div>
    </div>
  );
};