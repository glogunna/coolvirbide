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
  LogOut,
  Home,
  FolderOpen,
  Bell,
  Search,
  Filter,
  ChevronRight
} from 'lucide-react';
import { db, User as DatabaseUser, Project, NewsItem } from '../services/database';

interface HomeScreenProps {
  user: DatabaseUser;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      // Validate user and user.id before making database calls
      if (!user || !user.id || typeof user.id !== 'string' || user.id.trim() === '') {
        console.error('Invalid user ID:', user?.id);
        setIsLoading(false);
        return;
      }

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
      // Validate user ID before forking
      if (!user || !user.id || typeof user.id !== 'string' || user.id.trim() === '') {
        console.error('Invalid user ID for forking:', user?.id);
        return;
      }

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
      case 'game3d': return <Gamepad2 className="w-5 h-5 text-emerald-400" />;
      case 'game2d': return <Smartphone className="w-5 h-5 text-mint-400" />;
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

  const filteredProjects = userProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = projectFilter === 'all' || project.type === projectFilter;
    return matchesSearch && matchesFilter;
  });

  const sidebarItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { id: 'projects', label: 'My Projects', icon: <FolderOpen className="w-5 h-5" /> },
    { id: 'community', label: 'Community', icon: <Star className="w-5 h-5" /> },
    { id: 'notifications', label: 'Updates', icon: <Bell className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
  ];

  const renderHomeTab = () => (
    <div className="space-y-8">
      {/* Welcome Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 via-green-500/10 to-mint-500/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/5 to-green-400/5 backdrop-blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Infinity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                Welcome back, {user?.username || 'User'}!
              </h1>
              <p className="text-emerald-200/80">Ready to build something amazing today?</p>
            </div>
          </div>
          <button
            onClick={onCreateProject}
            className="group flex items-center gap-3 px-6 py-3 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-900 font-semibold rounded-2xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            Create New Project
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-green-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 right-12 w-20 h-20 bg-gradient-to-br from-mint-400/10 to-emerald-500/10 rounded-full blur-xl"></div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Projects', value: userProjects.length, icon: <FolderOpen className="w-6 h-6" />, color: 'emerald' },
          { label: 'Public Projects', value: userProjects.filter(p => p.isPublic).length, icon: <Globe className="w-6 h-6" />, color: 'green' },
          { label: 'Total Forks', value: userProjects.reduce((sum, p) => sum + p.forkCount, 0), icon: <GitFork className="w-6 h-6" />, color: 'mint' }
        ].map((stat, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-gradient-to-br from-${stat.color}-400/20 to-${stat.color}-500/20 rounded-xl flex items-center justify-center`}>
                <div className={`text-${stat.color}-400`}>{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Latest News */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Latest Updates</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {news.map((item) => (
            <div key={item.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300">
              {item.imageUrl && (
                <div className="relative overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{getNewsIcon(item.type)}</span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full border border-emerald-400/30">
                    {item.type.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-sm">{formatDate(item.createdAt)}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">{item.title}</h3>
                <p className="text-gray-300 text-sm mb-3 line-clamp-2">{item.content}</p>
                <p className="text-gray-400 text-xs">by {item.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Community Projects */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Featured Community Projects</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {publicProjects.map((project) => (
            <div key={project.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300">
              {project.thumbnail && (
                <div className="relative overflow-hidden">
                  <img 
                    src={project.thumbnail} 
                    alt={project.name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getProjectIcon(project.type)}
                  <h3 className="font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">{project.name}</h3>
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
                    className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-sm rounded-lg border border-emerald-400/30 transition-all duration-300 hover:scale-105"
                  >
                    Fork
                  </button>
                  <button className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition-all duration-300">
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
      {/* Header with Search and Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">My Projects</h2>
          <p className="text-gray-400">Manage and organize your creative projects</p>
        </div>
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white placeholder-gray-400 focus:border-emerald-400/50 focus:outline-none transition-all duration-300"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="pl-12 pr-8 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-white focus:border-emerald-400/50 focus:outline-none appearance-none transition-all duration-300"
          >
            <option value="all">All Types</option>
            <option value="game3d">3D Games</option>
            <option value="game2d">2D Games</option>
            <option value="webapp">Web Apps</option>
          </select>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Gamepad2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {searchTerm || projectFilter !== 'all' ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-400 mb-8">
            {searchTerm || projectFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Create your first project to get started!'
            }
          </p>
          <button
            onClick={onCreateProject}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-emerald-400/30 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-3 mb-4">
                {getProjectIcon(project.type)}
                <h3 className="font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">{project.name}</h3>
                {project.isPublic && (
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-400/30">
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
                <span className="capitalize px-2 py-1 bg-white/10 rounded-full">{project.type}</span>
              </div>
              <button
                onClick={() => onOpenProject(project)}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-300 rounded-xl border border-emerald-400/30 transition-all duration-300 hover:scale-105"
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Account Settings</h2>
        <p className="text-gray-400">Manage your account preferences and information</p>
      </div>
      
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-white mb-6">Profile Information</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Username</label>
            <input
              type="text"
              value={user?.username || ''}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Member Since</label>
            <input
              type="text"
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white"
              readOnly
            />
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-white mb-6">Account Actions</h3>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl border border-red-400/30 transition-all duration-300 hover:scale-105"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Infinity className="w-8 h-8 text-white" />
          </div>
          <p className="text-white text-lg">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-emerald-900/20 flex">
      {/* Sidebar */}
      <div className="w-80 bg-black/40 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Infinity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                Virb.IO
              </h1>
              <p className="text-xs text-gray-400">Creative Platform</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-xl flex items-center justify-center border border-emerald-400/30">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user?.username || 'User'}</p>
              <p className="text-gray-400 text-sm truncate">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-300 border border-emerald-400/30 shadow-lg shadow-emerald-500/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {activeTab === item.id && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white capitalize">
                {activeTab === 'home' ? 'Dashboard' : activeTab}
              </h1>
              <p className="text-gray-400 mt-1">
                {activeTab === 'home' && 'Welcome to your creative workspace'}
                {activeTab === 'projects' && `${userProjects.length} projects in your workspace`}
                {activeTab === 'community' && 'Discover amazing community projects'}
                {activeTab === 'notifications' && 'Stay updated with the latest news'}
                {activeTab === 'settings' && 'Manage your account preferences'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-400">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</p>
                <p className="text-white font-medium">{user?.username || 'User'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'home' && renderHomeTab()}
            {activeTab === 'projects' && renderProjectsTab()}
            {activeTab === 'community' && renderHomeTab()} {/* Reuse home for now */}
            {activeTab === 'notifications' && renderHomeTab()} {/* Reuse home for now */}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
        </main>
      </div>
    </div>
  );
};