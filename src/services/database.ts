// Database service for user accounts and projects
// Using IndexedDB for client-side persistence (simulating a real database)

interface User {
  id: string;
  username: string;
  email: string;
  password: string; // In real app, this would be hashed
  createdAt: string;
  lastLogin: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
  description: string;
  userId: string;
  isPublic: boolean;
  license: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  data: any; // Project data
  thumbnail?: string;
  forkCount: number;
  likeCount: number;
  originalProjectId?: string; // For forks
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  type: 'update' | 'feature' | 'community' | 'tutorial';
  imageUrl?: string;
  createdAt: string;
  author: string;
}

class DatabaseService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'VirbIODB';
  private readonly DB_VERSION = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.seedData();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
          userStore.createIndex('username', 'username', { unique: true });
        }

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('userId', 'userId', { unique: false });
          projectStore.createIndex('isPublic', 'isPublic', { unique: false });
          projectStore.createIndex('type', 'type', { unique: false });
        }

        // News store
        if (!db.objectStoreNames.contains('news')) {
          const newsStore = db.createObjectStore('news', { keyPath: 'id' });
          newsStore.createIndex('type', 'type', { unique: false });
          newsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  private async seedData(): Promise<void> {
    // Seed news data
    const newsItems: NewsItem[] = [
      {
        id: 'news-1',
        title: 'Virb.IO v2.0 Released!',
        content: 'Major update with improved 3D rendering, new physics engine, and enhanced scripting capabilities.',
        type: 'update',
        imageUrl: 'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=1',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        author: 'Virb.IO Team'
      },
      {
        id: 'news-2',
        title: 'New Tutorial: Building Your First 3D Game',
        content: 'Learn how to create a complete 3D platformer game from scratch using Virb.IO\'s powerful tools.',
        type: 'tutorial',
        imageUrl: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=1',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        author: 'GameDev Pro'
      },
      {
        id: 'news-3',
        title: 'Community Showcase: Amazing Projects',
        content: 'Check out the incredible games and applications our community has built this month!',
        type: 'community',
        imageUrl: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=1',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        author: 'Community Team'
      },
      {
        id: 'news-4',
        title: 'New Feature: Real-time Collaboration',
        content: 'Work together with your team in real-time! Multiple developers can now edit the same project simultaneously.',
        type: 'feature',
        imageUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400&h=200&dpr=1',
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        author: 'Virb.IO Team'
      }
    ];

    // Seed public projects
    const publicProjects: Project[] = [
      {
        id: 'public-1',
        name: 'Space Explorer 3D',
        type: 'game3d',
        description: 'An immersive 3D space exploration game with realistic physics and stunning visuals.',
        userId: 'demo-user-1',
        isPublic: true,
        license: 'MIT',
        tags: ['3D', 'Space', 'Physics', 'Adventure'],
        createdAt: new Date(Date.now() - 604800000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        data: { /* project data */ },
        thumbnail: 'https://images.pexels.com/photos/586063/pexels-photo-586063.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1',
        forkCount: 24,
        likeCount: 156
      },
      {
        id: 'public-2',
        name: 'Retro Platformer',
        type: 'game2d',
        description: 'A classic 2D platformer with pixel art graphics and nostalgic gameplay.',
        userId: 'demo-user-2',
        isPublic: true,
        license: 'CC BY-SA',
        tags: ['2D', 'Platformer', 'Retro', 'Pixel Art'],
        createdAt: new Date(Date.now() - 1209600000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
        data: { /* project data */ },
        thumbnail: 'https://images.pexels.com/photos/442576/pexels-photo-442576.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1',
        forkCount: 18,
        likeCount: 89
      },
      {
        id: 'public-3',
        name: 'Task Manager Pro',
        type: 'webapp',
        description: 'A powerful task management web application with real-time collaboration features.',
        userId: 'demo-user-3',
        isPublic: true,
        license: 'Apache 2.0',
        tags: ['Web App', 'Productivity', 'Collaboration'],
        createdAt: new Date(Date.now() - 1814400000).toISOString(),
        updatedAt: new Date(Date.now() - 259200000).toISOString(),
        data: { /* project data */ },
        thumbnail: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=1',
        forkCount: 12,
        likeCount: 67
      }
    ];

    try {
      // Check if news already exists
      const existingNews = await this.getAllNews();
      if (existingNews.length === 0) {
        for (const item of newsItems) {
          await this.addNews(item);
        }
      }

      // Check if public projects already exist
      const existingProjects = await this.getPublicProjects();
      if (existingProjects.length === 0) {
        for (const project of publicProjects) {
          await this.addProject(project);
        }
      }
    } catch (error) {
      console.log('Seeding data (this is normal on first run)');
    }
  }

  // User methods
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');

    const user: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readwrite');
      const store = transaction.objectStore('users');
      const request = store.add(user);

      request.onsuccess = () => resolve(user);
      request.onerror = () => reject(request.error);
    });
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const index = store.index('email');
      const request = index.get(email);

      request.onsuccess = () => {
        const user = request.result;
        if (user && user.password === password) {
          // Update last login
          user.lastLogin = new Date().toISOString();
          const updateTransaction = this.db!.transaction(['users'], 'readwrite');
          const updateStore = updateTransaction.objectStore('users');
          updateStore.put(user);
          resolve(user);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getUserById(id: string): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['users'], 'readonly');
      const store = transaction.objectStore('users');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Project methods
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'forkCount' | 'likeCount'>): Promise<Project> {
    if (!this.db) throw new Error('Database not initialized');

    const project: Project = {
      ...projectData,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      forkCount: 0,
      likeCount: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.add(project);

      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const getRequest = store.get(projectId);

      getRequest.onsuccess = () => {
        const project = getRequest.result;
        if (project) {
          const updatedProject = {
            ...project,
            ...updates,
            updatedAt: new Date().toISOString()
          };
          const putRequest = store.put(updatedProject);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Project not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    if (!this.db) throw new Error('Database not initialized');

    // Add explicit validation for userId to prevent IndexedDB errors
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      console.warn('Invalid userId provided to getUserProjects:', userId);
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const index = store.index('userId');
      const request = index.getAll(userId);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPublicProjects(): Promise<Project[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const index = store.index('isPublic');
      const request = index.getAll(true);

      request.onsuccess = () => {
        const projects = request.result.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        resolve(projects);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async forkProject(projectId: string, userId: string, newName: string): Promise<Project> {
    if (!this.db) throw new Error('Database not initialized');

    const originalProject = await this.getProjectById(projectId);
    if (!originalProject) throw new Error('Project not found');

    const forkedProject: Project = {
      ...originalProject,
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      userId,
      originalProjectId: projectId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      forkCount: 0,
      likeCount: 0,
      isPublic: false // Forks start as private
    };

    // Increment fork count of original project
    await this.updateProject(projectId, { 
      forkCount: originalProject.forkCount + 1 
    });

    return this.addProject(forkedProject);
  }

  private async getProjectById(id: string): Promise<Project | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async addProject(project: Project): Promise<Project> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.add(project);

      request.onsuccess = () => resolve(project);
      request.onerror = () => reject(request.error);
    });
  }

  // News methods
  async getAllNews(): Promise<NewsItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['news'], 'readonly');
      const store = transaction.objectStore('news');
      const request = store.getAll();

      request.onsuccess = () => {
        const news = request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(news);
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async addNews(newsItem: NewsItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['news'], 'readwrite');
      const store = transaction.objectStore('news');
      const request = store.add(newsItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new DatabaseService();
export type { User, Project, NewsItem };