import { prisma, isDatabaseConnected } from './prisma.js';
import { logger } from '../config/logger.js';
import { articleRepository, memoryStore, StoredArticle } from './articleRepository.js';

interface MemoryBookmark {
  id: string;
  userId: string;
  articleId: string;
  createdAt: Date;
}

interface MemoryPreference {
  id: string;
  userId: string;
  preferredCategories: string[];
  preferredSources: string[];
  updatedAt: Date;
}

export interface StoredUser {
  id: string;
  email: string;
  name?: string | null;
  passwordHash?: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

class MemoryUserStore {
  private users = new Map<string, StoredUser>();
  private bookmarks = new Map<string, MemoryBookmark>();
  private preferences = new Map<string, MemoryPreference>();

  saveUser(user: StoredUser): StoredUser {
    this.users.set(user.id, user);
    return user;
  }

  findUserByEmail(email: string): StoredUser | null {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  findUserById(id: string): StoredUser | null {
    return this.users.get(id) || null;
  }

  addBookmark(userId: string, articleId: string): MemoryBookmark {
    const key = `${userId}:${articleId}`;
    let b = this.bookmarks.get(key);
    if (!b) {
      b = {
        id: 'bm-' + Math.random().toString(36).slice(2, 9),
        userId,
        articleId,
        createdAt: new Date(),
      };
      this.bookmarks.set(key, b);
    }
    return b;
  }

  removeBookmark(userId: string, articleId: string): boolean {
    const key = `${userId}:${articleId}`;
    return this.bookmarks.delete(key);
  }

  getBookmarks(userId: string): StoredArticle[] {
    const results: StoredArticle[] = [];
    for (const b of this.bookmarks.values()) {
      if (b.userId === userId) {
        const art = memoryStore.getArticleById(b.articleId);
        if (art) results.push(art);
      }
    }
    return results;
  }

  isBookmarked(userId: string, articleId: string): boolean {
    return this.bookmarks.has(`${userId}:${articleId}`);
  }

  getPreferences(userId: string): MemoryPreference {
    let p = this.preferences.get(userId);
    if (!p) {
      p = {
        id: 'pref-' + userId,
        userId,
        preferredCategories: ['technology', 'science', 'business'],
        preferredSources: [],
        updatedAt: new Date(),
      };
      this.preferences.set(userId, p);
    }
    return p;
  }

  setPreferences(userId: string, prefs: { preferredCategories: string[]; preferredSources: string[] }): MemoryPreference {
    const updated: MemoryPreference = {
      id: 'pref-' + userId,
      userId,
      preferredCategories: prefs.preferredCategories,
      preferredSources: prefs.preferredSources,
      updatedAt: new Date(),
    };
    this.preferences.set(userId, updated);
    return updated;
  }
}

const memoryUserStore = new MemoryUserStore();

export class UserRepository {
  async findUserByEmail(email: string): Promise<StoredUser | null> {
    if (!isDatabaseConnected()) {
      return memoryUserStore.findUserByEmail(email);
    }
    try {
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      return (user as StoredUser) || null;
    } catch {
      return memoryUserStore.findUserByEmail(email);
    }
  }

  async findUserById(id: string): Promise<StoredUser | null> {
    if (!isDatabaseConnected()) {
      return memoryUserStore.findUserById(id);
    }
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return (user as StoredUser) || null;
    } catch {
      return memoryUserStore.findUserById(id);
    }
  }

  async createUser(data: { email: string; name?: string; passwordHash?: string; role?: string }): Promise<StoredUser> {
    const role = data.role || 'user';
    const email = data.email.toLowerCase();

    if (!isDatabaseConnected()) {
      const user: StoredUser = {
        id: 'usr-' + Math.random().toString(36).slice(2, 10),
        email,
        name: data.name || null,
        passwordHash: data.passwordHash || null,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return memoryUserStore.saveUser(user);
    }

    try {
      const user = await prisma.user.create({
        data: {
          email,
          name: data.name || null,
          passwordHash: data.passwordHash || null,
          role,
        },
      });
      return user as StoredUser;
    } catch (err: any) {
      logger.warn(`Prisma createUser error: ${err.message}. Using memory store.`);
      const user: StoredUser = {
        id: 'usr-' + Math.random().toString(36).slice(2, 10),
        email,
        name: data.name || null,
        passwordHash: data.passwordHash || null,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return memoryUserStore.saveUser(user);
    }
  }

  async ensureUser(id: string, email: string, name?: string) {
    if (!isDatabaseConnected()) return { id, email, name };
    try {
      return await prisma.user.upsert({
        where: { id },
        update: { email, name },
        create: { id, email, name },
      });
    } catch {
      return { id, email, name };
    }
  }

  async getBookmarks(userId: string): Promise<StoredArticle[]> {
    if (!isDatabaseConnected()) {
      return memoryUserStore.getBookmarks(userId);
    }

    try {
      const records = await prisma.bookmark.findMany({
        where: { userId },
        include: {
          article: {
            include: {
              source: true,
              analysis: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return records.map(r => r.article as unknown as StoredArticle);
    } catch (err: any) {
      logger.warn(`Prisma getBookmarks error: ${err.message}. Using memory store.`);
      return memoryUserStore.getBookmarks(userId);
    }
  }

  async addBookmark(userId: string, articleId: string) {
    memoryUserStore.addBookmark(userId, articleId);

    if (isDatabaseConnected()) {
      try {
        await this.ensureUser(userId, `${userId}@example.com`, 'User');
        return await prisma.bookmark.upsert({
          where: {
            userId_articleId: { userId, articleId },
          },
          update: {},
          create: { userId, articleId },
        });
      } catch (err: any) {
        logger.warn(`Prisma addBookmark error: ${err.message}`);
      }
    }
    return { userId, articleId };
  }

  async removeBookmark(userId: string, articleId: string): Promise<boolean> {
    memoryUserStore.removeBookmark(userId, articleId);

    if (isDatabaseConnected()) {
      try {
        await prisma.bookmark.deleteMany({
          where: { userId, articleId },
        });
        return true;
      } catch (err: any) {
        logger.warn(`Prisma removeBookmark error: ${err.message}`);
      }
    }
    return true;
  }

  async getPreferences(userId: string) {
    if (!isDatabaseConnected()) {
      return memoryUserStore.getPreferences(userId);
    }

    try {
      const pref = await prisma.userPreference.findUnique({
        where: { userId },
      });
      return pref || memoryUserStore.getPreferences(userId);
    } catch {
      return memoryUserStore.getPreferences(userId);
    }
  }

  async updatePreferences(userId: string, prefs: { preferredCategories: string[]; preferredSources: string[] }) {
    memoryUserStore.setPreferences(userId, prefs);

    if (isDatabaseConnected()) {
      try {
        await this.ensureUser(userId, `${userId}@example.com`, 'User');
        return await prisma.userPreference.upsert({
          where: { userId },
          update: {
            preferredCategories: prefs.preferredCategories as any,
            preferredSources: prefs.preferredSources as any,
          },
          create: {
            userId,
            preferredCategories: prefs.preferredCategories as any,
            preferredSources: prefs.preferredSources as any,
          },
        });
      } catch (err: any) {
        logger.warn(`Prisma updatePreferences error: ${err.message}`);
      }
    }
    return prefs;
  }
}

export const userRepository = new UserRepository();
