import React, { useState, useEffect } from 'react';
import { 
  Infinity, 
  Plus, 
  Star, 
  GitFork, 
  Calendar, 
  User, 
  Gamepad2, 
  Globe, 
  Smartphone,
  TrendingUp,
  Clock,
  Heart,
  Eye,
  Settings,
  LogOut
} from 'lucide-react';
import { db, type User, type Project, type NewsItem } from '../services/database';

interface HomeScreenProps {
  user: User;
  onCreateProject: () => void;
  onOpenProject: (project: Project) => void;
  onLogout: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  user, 
  onCreateProject, 
  onOpenProject, 
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [projects, publicProjs, newsItems] = await Promise.all([
        db.getUserProjects(user.id),
        db.getPublicProjects(),
        db.getAllNews()
      ]);
      
      setUserProjects(projects);
      setPublicProjects(publicProjs.slice(0, 6)); // Show top 6
      setNews(newsItems.slice(0, 4)); // Show latest 4
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForkProject = async (project: Project) => {
    try {
      const forkedProject = await db.forkProject(
        project.id, 
        user.id, 
        `${project.name} (Fork)`
      );
      setUserProjects(prev => [forkedProject, ...prev]);
    } catch (error) {
      console.error('Error forking project:', error);
    }
  };

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'game3d': return <Gamepad2 className="w-5 h-5 text-purple-400" />;
      case 'game2d': return <Smartphone className="w-5 h-5 text-blue-400" />;
      case 'webapp': return <Globe className="w-5 h-5 text-green-400" />;
      default: return <Gamepad2 className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNewsIcon = (type: string) => {
    switch (type) {
      case 'update': return '🚀';
      case 'feature': return '✨';
      case 'community': return '👥';
      case 'tutorial': return '📚';
      default: return '📰';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderHomeTab = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user.username}!</h1>
        <p className="text-green-100 mb-6">Ready to build something amazing today?</p>
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create New Project
        </button>
      </div>

      {/* News & Updates */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Latest News & Updates</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {news.map((item) => (
            <div key={item.id} className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-colors">
              {item.imageUrl && (
                <img 
                  src={item.imageUrl} 
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{getNewsIcon(item.type)}</span>
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                    {item.type.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-sm">{formatDate(item.createdAt)}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm mb-3">{item.content}</p>
                <p className="text-gray-400 text-xs">by {item.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Public Projects */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">Featured Community Projects</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {publicProjects.map((project) => (
            <div key={project.id} className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-colors">
              {project.thumbnail && (
                <img 
                  src={project.thumbnail} 
                  alt={project.name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getProjectIcon(project.type)}
                  <h3 className="font-semibold text-white truncate">{project.name}</h3>
                </div>
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{project.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {project.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="w-3 h-3" />
                      {project.forkCount}
                    </span>
                  </div>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleForkProject(project)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Fork
                  </button>
                  <button className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">My Projects</h2>
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {userProjects.length === 0 ? (
        <div className="text-center py-12">
          <Gamepad2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-gray-400 mb-6">Create your first project to get started!</p>
          <button
            onClick={onCreateProject}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userProjects.map((project) => (
            <div key={project.id} className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                {getProjectIcon(project.type)}
                <h3 className="font-semibold text-white truncate">{project.name}</h3>
                {project.isPublic && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                    Public
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm mb-4 line-clamp-2">{project.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(project.updatedAt)}
                </span>
                <span className="capitalize">{project.type}</span>
              </div>
              <button
                onClick={() => onOpenProject(project)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Open Project
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Account Settings</h2>
      
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              value={user.username}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={user.email}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Member Since</label>
            <input
              type="text"
              value={new Date(user.createdAt).toLocaleDateString()}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Actions</h3>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Infinity className="w-12 h-12 text-green-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Infinity className="w-8 h-8 text-green-400" />
            <h1 className="text-2xl font-bold text-green-400">Virb.IO</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-300">Welcome, {user.username}</span>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6">
        <div className="flex space-x-8">
          {[
            { id: 'home', label: 'Home', icon: <TrendingUp className="w-5 h-5" /> },
            { id: 'projects', label: 'Projects', icon: <Gamepad2 className="w-5 h-5" /> },
            { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-green-400 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'home' && renderHomeTab()}
          {activeTab === 'projects' && renderProjectsTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </main>
    </div>
  );
};