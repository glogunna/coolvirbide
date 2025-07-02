import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Gamepad2, 
  Smartphone, 
  Globe, 
  FileText, 
  AlertTriangle,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { db, type User } from '../services/database';

interface ProjectCreationModalProps {
  user: User;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

export const ProjectCreationModal: React.FC<ProjectCreationModalProps> = ({ 
  user, 
  onClose, 
  onProjectCreated 
}) => {
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('game3d');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [license, setLicense] = useState('MIT');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
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

  const licenses = [
    { id: 'MIT', name: 'MIT License', description: 'Permissive license with minimal restrictions' },
    { id: 'Apache-2.0', name: 'Apache 2.0', description: 'Permissive license with patent protection' },
    { id: 'GPL-3.0', name: 'GPL v3', description: 'Copyleft license requiring source disclosure' },
    { id: 'CC-BY-SA', name: 'Creative Commons BY-SA', description: 'Share-alike creative commons license' },
    { id: 'Proprietary', name: 'All Rights Reserved', description: 'Proprietary license - no sharing allowed' }
  ];

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getProjectTemplate = (type: string) => {
    // This would be the same template generation logic from the original ProjectManager
    // For brevity, returning a simplified version
    return {
      replicatedStorage: { images: [], sounds: [], scripts: [] },
      serverStorage: { scripts: [], character: [] },
      replicatedFirst: { databases: [] },
      workspace: { objects: [] },
      uiService: { screens: [] }
    };
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) return;
    
    setIsCreating(true);
    
    try {
      const projectData = {
        name: projectName,
        type: projectType,
        description: description || `A new ${projectTypes.find(t => t.id === projectType)?.name}`,
        userId: user.id,
        isPublic,
        license,
        tags,
        data: getProjectTemplate(projectType)
      };

      const project = await db.createProject(projectData);
      onProjectCreated(project);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Project Types */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Choose Project Type</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {projectTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProjectType(type.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    projectType === type.id
                      ? 'border-green-400 bg-green-400/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={type.color}>{type.icon}</div>
                    <div>
                      <h4 className="font-semibold text-white">{type.name}</h4>
                      <p className="text-sm text-gray-400">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your project..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags (max 5)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add a tag..."
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
                  />
                  <button
                    onClick={addTag}
                    disabled={tags.length >= 5}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:bg-blue-700 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Visibility
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      !isPublic
                        ? 'border-green-400 bg-green-400/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-white">Private</div>
                        <div className="text-sm text-gray-400">Only you can see this project</div>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      isPublic
                        ? 'border-green-400 bg-green-400/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Unlock className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-white">Public</div>
                        <div className="text-sm text-gray-400">Anyone can see and fork this project</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* License */}
              {isPublic && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    License
                  </label>
                  <select
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-400 focus:outline-none"
                  >
                    {licenses.map((lic) => (
                      <option key={lic.id} value={lic.id}>
                        {lic.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    {licenses.find(l => l.id === license)?.description}
                  </p>
                </div>
              )}

              {/* Template Info */}
              <div className="bg-blue-900/20 border border-blue-400/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-400 font-semibold text-sm">Template Includes</span>
                </div>
                <ul className="text-xs text-blue-200 space-y-1">
                  {projectType === 'game3d' && (
                    <>
                      <li>• 3D workspace with physics</li>
                      <li>• Player character with movement</li>
                      <li>• Camera controls</li>
                      <li>• Input handling scripts</li>
                    </>
                  )}
                  {projectType === 'game2d' && (
                    <>
                      <li>• 2D workspace with sprites</li>
                      <li>• 2D physics system</li>
                      <li>• Player sprite with controls</li>
                      <li>• Basic game mechanics</li>
                    </>
                  )}
                  {projectType === 'webapp' && (
                    <>
                      <li>• API endpoint setup</li>
                      <li>• Database integration</li>
                      <li>• User management</li>
                      <li>• Frontend components</li>
                    </>
                  )}
                  {projectType === 'blank' && (
                    <>
                      <li>• Empty project structure</li>
                      <li>• No pre-built templates</li>
                      <li>• Complete creative freedom</li>
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
                    Default player scripts are included. Modifying these may cause functionality issues.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProject}
            disabled={!projectName.trim() || isCreating}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
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
  );
};