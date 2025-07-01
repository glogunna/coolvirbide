import React, { useState } from 'react';
import { Plus, Move, Type, Square, Circle, Image, Settings, Trash2, Copy, Code, Play } from 'lucide-react';

interface UIEditorProps {
  currentFile: any;
}

export const UIEditor: React.FC<UIEditorProps> = ({ currentFile }) => {
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [elements, setElements] = useState(currentFile?.content?.elements || []);
  const [showProperties, setShowProperties] = useState(false);
  const [showScriptEditor, setShowScriptEditor] = useState(false);
  const [elementScript, setElementScript] = useState('');

  const elementTypes = [
    { id: 'frame', name: 'Frame', icon: <Square className="w-4 h-4" />, color: 'text-gray-400' },
    { id: 'textlabel', name: 'TextLabel', icon: <Type className="w-4 h-4" />, color: 'text-blue-400' },
    { id: 'textbutton', name: 'TextButton', icon: <Square className="w-4 h-4" />, color: 'text-green-400' },
    { id: 'imagelabel', name: 'ImageLabel', icon: <Image className="w-4 h-4" />, color: 'text-purple-400' },
    { id: 'imagebutton', name: 'ImageButton', icon: <Image className="w-4 h-4" />, color: 'text-yellow-400' },
    { id: 'scrollingframe', name: 'ScrollingFrame', icon: <Square className="w-4 h-4" />, color: 'text-cyan-400' }
  ];

  const addElement = (type: string) => {
    const newElement = {
      id: Date.now(),
      type,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
      text: type.includes('text') ? 'Text' : '',
      position: { x: 100, y: 100 },
      size: { width: type === 'textlabel' ? 200 : 100, height: type === 'textlabel' ? 50 : 50 },
      anchorPoint: { x: 0, y: 0 },
      style: {
        backgroundColor: getDefaultBackgroundColor(type),
        textColor: '#FFFFFF',
        borderColor: '#000000',
        fontSize: 14,
        fontWeight: 'normal',
        textAlign: 'center',
        borderWidth: 0,
        cornerRadius: 0,
        transparency: 0,
        zIndex: 1
      },
      script: '',
      visible: true,
      active: true
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement);
    setShowProperties(true);
  };

  const getDefaultBackgroundColor = (type: string) => {
    switch (type) {
      case 'textbutton': return '#3B82F6';
      case 'imagebutton': return '#10B981';
      case 'frame': return '#374151';
      case 'scrollingframe': return '#1F2937';
      default: return 'transparent';
    }
  };

  const updateElement = (id: number, updates: any) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...updates } : el));
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };

  const deleteElement = (id: number) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
      setShowProperties(false);
    }
  };

  const duplicateElement = (element: any) => {
    const newElement = {
      ...element,
      id: Date.now(),
      name: element.name + '_Copy',
      position: { x: element.position.x + 20, y: element.position.y + 20 }
    };
    setElements([...elements, newElement]);
  };

  const openScriptEditor = (element: any) => {
    setSelectedElement(element);
    setElementScript(element.script || getDefaultScript(element.type));
    setShowScriptEditor(true);
  };

  const getDefaultScript = (type: string) => {
    if (type.includes('button')) {
      return `-- ${type} Script
function onActivated()
    print("Button clicked!")
    
    -- Add your button logic here
    -- Example: Change text or navigate to another screen
    inst player = game.Players.LocalPlayer
    print("Player " + player.Name + " clicked the button")
end

-- Connect the function to the button
script.Parent.Activated:Connect(onActivated)`;
    }
    return `-- ${type} Script
-- Add your custom logic here

function onChanged(property)
    print("Property changed: " + property)
end

-- Connect to property changes
script.Parent.Changed:Connect(onChanged)`;
  };

  const saveScript = () => {
    if (selectedElement) {
      updateElement(selectedElement.id, { script: elementScript });
      setShowScriptEditor(false);
    }
  };

  const renderElement = (element: any) => {
    if (!element.visible) return null;

    const style = {
      position: 'absolute' as const,
      left: element.position.x,
      top: element.position.y,
      width: element.size.width,
      height: element.size.height,
      backgroundColor: element.style.backgroundColor,
      color: element.style.textColor,
      fontSize: element.style.fontSize,
      fontWeight: element.style.fontWeight,
      textAlign: element.style.textAlign as any,
      border: element.style.borderWidth > 0 ? `${element.style.borderWidth}px solid ${element.style.borderColor}` : 'none',
      borderRadius: element.style.cornerRadius,
      opacity: 1 - element.style.transparency,
      zIndex: element.style.zIndex,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.style.textAlign === 'center' ? 'center' : element.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
      padding: '4px 8px',
      boxSizing: 'border-box' as const,
      outline: selectedElement?.id === element.id ? '2px solid #10B981' : 'none',
      outlineOffset: '2px'
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedElement(element);
      setShowProperties(true);
    };

    const content = element.text || element.name;

    switch (element.type) {
      case 'textlabel':
        return (
          <div key={element.id} style={style} onClick={handleClick}>
            {content}
          </div>
        );
      case 'textbutton':
        return (
          <button key={element.id} style={style} onClick={handleClick}>
            {content}
          </button>
        );
      case 'frame':
      case 'scrollingframe':
        return (
          <div key={element.id} style={style} onClick={handleClick}>
            {element.type === 'scrollingframe' && (
              <div className="text-xs text-gray-400">Scrolling Frame</div>
            )}
          </div>
        );
      case 'imagelabel':
      case 'imagebutton':
        const ImageComponent = element.type === 'imagebutton' ? 'button' : 'div';
        return (
          <ImageComponent key={element.id} style={style} onClick={handleClick}>
            <Image className="w-6 h-6 text-gray-400" />
          </ImageComponent>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex">
      {/* Toolbox */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white mb-4">UI Elements</h3>
        <div className="space-y-2">
          {elementTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => addElement(type.id)}
              className="w-full flex items-center gap-3 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
            >
              <div className={type.color}>{type.icon}</div>
              <span className="text-white text-sm">{type.name}</span>
            </button>
          ))}
        </div>

        {/* Element Hierarchy */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-white mb-3">Hierarchy ({elements.length})</h4>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {elements.map((element) => (
              <div
                key={element.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors group ${
                  selectedElement?.id === element.id ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={() => {
                  setSelectedElement(element);
                  setShowProperties(true);
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span className="text-sm text-white truncate">{element.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openScriptEditor(element);
                    }}
                    className="p-1 hover:bg-gray-500 rounded"
                    title="Edit Script"
                  >
                    <Code className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateElement(element);
                    }}
                    className="p-1 hover:bg-gray-500 rounded"
                    title="Duplicate"
                  >
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElement(element.id);
                    }}
                    className="p-1 hover:bg-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-800" style={{ backgroundImage: 'radial-gradient(circle, #374151 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {/* Canvas Header */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center justify-between">
            <h3 className="text-white font-semibold">{currentFile.name} - UI Editor</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">800x600</span>
              <button className="p-2 hover:bg-gray-700 rounded">
                <Play className="w-4 h-4 text-gray-400" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded">
                <Settings className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div 
            className="relative bg-gray-600 m-4 rounded-lg shadow-lg"
            style={{ width: 800, height: 600 }}
            onClick={() => {
              setSelectedElement(null);
              setShowProperties(false);
            }}
          >
            {elements.map(renderElement)}
          </div>
        </div>
      </div>

      {/* Properties Panel */}
      {showProperties && selectedElement && (
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Properties</h3>
            <button
              onClick={() => setShowProperties(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Basic Properties */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                value={selectedElement.name || ''}
                onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>

            {selectedElement.type.includes('text') && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Text</label>
                <input
                  type="text"
                  value={selectedElement.text || ''}
                  onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                />
              </div>
            )}

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">X</label>
                  <input
                    type="number"
                    value={selectedElement.position.x}
                    onChange={(e) => updateElement(selectedElement.id, { 
                      position: { ...selectedElement.position, x: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Y</label>
                  <input
                    type="number"
                    value={selectedElement.position.y}
                    onChange={(e) => updateElement(selectedElement.id, { 
                      position: { ...selectedElement.position, y: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Size</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Width</label>
                  <input
                    type="number"
                    value={selectedElement.size.width}
                    onChange={(e) => updateElement(selectedElement.id, { 
                      size: { ...selectedElement.size, width: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Height</label>
                  <input
                    type="number"
                    value={selectedElement.size.height}
                    onChange={(e) => updateElement(selectedElement.id, { 
                      size: { ...selectedElement.size, height: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Style Properties */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Background Color</label>
              <input
                type="color"
                value={selectedElement.style.backgroundColor || '#000000'}
                onChange={(e) => updateElement(selectedElement.id, { 
                  style: { ...selectedElement.style, backgroundColor: e.target.value }
                })}
                className="w-full h-10 bg-gray-700 border border-gray-600 rounded"
              />
            </div>

            {selectedElement.type.includes('text') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Text Color</label>
                  <input
                    type="color"
                    value={selectedElement.style.textColor || '#FFFFFF'}
                    onChange={(e) => updateElement(selectedElement.id, { 
                      style: { ...selectedElement.style, textColor: e.target.value }
                    })}
                    className="w-full h-10 bg-gray-700 border border-gray-600 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
                  <input
                    type="number"
                    value={selectedElement.style.fontSize || 14}
                    onChange={(e) => updateElement(selectedElement.id, { 
                      style: { ...selectedElement.style, fontSize: parseInt(e.target.value) || 14 }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  />
                </div>
              </>
            )}

            {/* Visibility */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedElement.visible}
                onChange={(e) => updateElement(selectedElement.id, { visible: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm text-gray-300">Visible</label>
            </div>

            {/* Script Button */}
            <div className="pt-4 border-t border-gray-700">
              <button
                onClick={() => openScriptEditor(selectedElement)}
                className="w-full mb-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors flex items-center gap-2"
              >
                <Code className="w-4 h-4" />
                Edit Script
              </button>
              <button
                onClick={() => duplicateElement(selectedElement)}
                className="w-full mb-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                Duplicate Element
              </button>
              <button
                onClick={() => deleteElement(selectedElement.id)}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete Element
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Script Editor Modal */}
      {showScriptEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-3/4 h-3/4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Script Editor - {selectedElement?.name}
              </h3>
              <button
                onClick={() => setShowScriptEditor(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            
            <textarea
              value={elementScript}
              onChange={(e) => setElementScript(e.target.value)}
              className="flex-1 bg-gray-900 text-white font-mono text-sm p-4 rounded border border-gray-600 resize-none focus:outline-none focus:border-green-400"
              placeholder="-- Write your script here..."
            />
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={saveScript}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                Save Script
              </button>
              <button
                onClick={() => setShowScriptEditor(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};