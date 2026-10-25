import { Request, Response, NextFunction } from 'express';
import { BookmarkCreateSchema } from '../schemas/index.js';
import { userRepository } from '../repositories/userRepository.js';
import { articleRepository } from '../repositories/articleRepository.js';

export class BookmarkController {
  async getBookmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || 'guest-user-default';
      const bookmarks = await userRepository.getBookmarks(userId);
      res.json({ bookmarks, total: bookmarks.length });
    } catch (err) {
      next(err);
    }
  }

  async addBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || 'guest-user-default';
      const { articleId } = BookmarkCreateSchema.parse(req.body);

      const article = await articleRepository.findArticleById(articleId);
      if (!article) {
        res.status(404).json({ error: 'Article not found' });
        return;
      }

      const bookmark = await userRepository.addBookmark(userId, articleId);
      res.status(201).json({ message: 'Article bookmarked successfully', bookmark });
    } catch (err) {
      next(err);
    }
  }

  async removeBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || 'guest-user-default';
      const { id } = req.params; // articleId or bookmarkId

      await userRepository.removeBookmark(userId, id);
      res.json({ message: 'Bookmark removed successfully', articleId: id });
    } catch (err) {
      next(err);
    }
  }
}

export const bookmarkController = new BookmarkController();
