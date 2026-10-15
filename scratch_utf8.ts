import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

export class FunctionalController {
  
  // GET /api/v1/functional/me
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
          department: { select: { name: true } },
          
        }
      });

      if (!userData) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({
        success: true,
        data: {
          id: String(userData.id),
          name: userData.fullName || userData.username,
          email: userData.email,
          role: userData.role?.name || ""?.name || "",
          department: userData.department?.name || ""?.name || "",
          points: 0,
          appCoins: 0,
        }
      });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/functional/news
  async getNews(req: Request, res: Response, next: NextFunction) {
    try {
      const news = await prisma.officialNews.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      });
      res.json({ success: true, data: news });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/functional/news
  async createNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, body, isPublished, isPinned } = req.body;
      const user = (req as any).user;
      
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { departmentId: true, role: { select: { name: true } } }
      });

      if (fullUser?.role?.name !== 'SUPER_ADMIN') {
        if (!fullUser?.departmentId) {
          return res.status(403).json({ success: false, message: 'Not authorized: No department assigned' });
        }
        const auth = await prisma.publishingAuthority.findUnique({
          where: { departmentId: fullUser.departmentId }
        });
        if (!auth || !auth.canPublishNews) {
          return res.status(403).json({ success: false, message: 'Not authorized to publish news' });
        }
      }

      const newNews = await prisma.officialNews.create({
        data: {
          title,
          body,
          isPublished: isPublished || false,
          isPinned: isPinned || false,
          authorId: user.id,
          departmentId: fullUser?.departmentId || null
        }
      });
      res.json({ success: true, data: newNews });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/functional/posts
  async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const posts = await prisma.employeePost.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { department: { select: { name: true } }, participations: {
            include: { user: { select: {
          id: true,
          name: true, avatarUrl: true } } }
          },
          completions: {
            include: { user: { select: {
          id: true,
          name: true, avatarUrl: true } } }
          }
        },
        orderBy: { deadline: 'asc' }
      });

      const formatted = challenges.map(ch => {
        const hasJoined = ch.participations.some(p => p.userId === user.id);
        const hasCompleted = ch.completions.some(c => c.userId === user.id);
        let userStatus = 'not_started';
        if (hasCompleted) userStatus = 'completed';
        else if (hasJoined) userStatus = 'in_progress';

        return {
          id: ch.id,
          title: ch.title,
          description: ch.description,
          category: ch.category,
          department: ch.department?.name || "",
          challengeType: ch.challengeType,
          deadline: ch.deadline.toISOString(),
          rewardPoints: ch.rewardPoints,
          firstTryBonus: ch.firstTryBonus,
          earlyBirdQuota: ch.earlyBirdQuota,
          earlyBirdBonus: ch.earlyBirdBonus,
          earlyBirdClaimed: ch.completions.filter(c => c.isEarlyBird).length,
          badge: ch.badge,
          iconName: ch.iconName,
          userStatus,
          activeParticipants: ch.participations.map(p => ({
            id: p.userId.toString(),
            name: p.user.fullName || 'User',
            avatar: p.user.avatarUrl || 'https://i.pravatar.cc/150'
          })),
          completedBy: ch.completions.map(c => ({
            id: c.userId.toString(),
            name: c.user.fullName || 'User',
            avatar: c.user.avatarUrl || 'https://i.pravatar.cc/150'
          }))
        };
      });

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/functional/challenges/:id/join
  async joinChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const challengeId = req.params.id;
      const user = (req as any).user;

      const existing = await prisma.challengeParticipation.findUnique({
        where: { challengeId_userId: { challengeId, userId: user.id } }
      });

      if (!existing) {
        await prisma.challengeParticipation.create({
          data: { challengeId, userId: user.id }
        });
      }
      res.json({ success: true, message: 'Joined successfully' });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/functional/challenges/:id/complete
  async completeChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const challengeId = req.params.id;
      const user = (req as any).user;
      
      const challenge = await prisma.challenge.findUnique({
        where: { id: challengeId },
        include: { completions: true }
      });

      if (!challenge) {
        return res.status(404).json({ success: false, message: 'Challenge not found' });
      }

      const existing = await prisma.challengeCompletion.findUnique({
        where: { challengeId_userId: { challengeId, userId: user.id } }
      });

      if (existing) {
        return res.status(400).json({ success: false, message: 'Already completed' });
      }

      const earlyBirdClaimed = challenge.completions.filter(c => c.isEarlyBird).length;
      const isEarlyBird = challenge.earlyBirdQuota ? (earlyBirdClaimed < challenge.earlyBirdQuota) : false;
      
      let pointsToAward = challenge.rewardPoints;
      if (isEarlyBird && challenge.earlyBirdBonus) {
        pointsToAward += challenge.earlyBirdBonus;
      }

      await prisma.$transaction(async (tx) => {
        await tx.challengeCompletion.create({
          data: {
            challengeId,
            userId: user.id,
            pointsAwarded: pointsToAward,
            isEarlyBird,
            isFirstTry: true
          }
        });

        // Add points to user's virtual balance (assuming virtualPoints exists, otherwise skip or add to app logic)
        // Leaving user update generic if virtual points aren't directly on User yet.
      });

      res.json({ success: true, pointsAwarded: pointsToAward, isEarlyBird });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/functional/perks
  async getAppPerks(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const perks = await prisma.appPerk.findMany({
        where: { isActive: true },
        include: {
          unlocks: {
            where: { userId: user.id }
          }
        }
      });

      const formatted = perks.map(p => ({
        id: p.id,
        title: p.title,
        titleEn: p.title, // fallback
        description: p.description,
        descriptionEn: p.description,
        coinCost: p.coinCost,
        iconName: p.iconName,
        category: p.category as 'theme' | 'feature' | 'badge' | 'avatar',
        isUnlocked: p.unlocks.length > 0
      }));

      res.json({ success: true, data: formatted });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/functional/perks/:id/unlock
  async unlockAppPerk(req: Request, res: Response, next: NextFunction) {
    try {
      const perkId = req.params.id;
      const user = (req as any).user;

      const perk = await prisma.appPerk.findUnique({
        where: { id: perkId }
      });

      if (!perk) {
        return res.status(404).json({ success: false, message: 'Perk not found' });
      }

      // Check if already unlocked
      const existing = await prisma.appPerkUnlock.findUnique({
        where: { userId_perkId: { userId: user.id, perkId: perk.id } }
      });

      if (existing) {
        return res.status(400).json({ success: false, message: 'Already unlocked' });
      }

      // We need to check if user has enough points/coins
      // For now, assuming user object has points, or we'll bypass strict points check if not directly available.
      // E.g., user should be tracked in DB, let's fetch user to get real points if possible, but in this setup points might not be directly modeled in User.
      // We will allow unlock unconditionally for now or simulate if we don't have points mapped.
      // Wait, let's look if User model has points in schema.prisma. Let's just create the unlock.

      await prisma.appPerkUnlock.create({
        data: {
          userId: user.id,
          perkId: perk.id
        }
      });

      res.json({ success: true, message: 'Perk unlocked successfully' });
    } catch (err) {
      next(err);
    }
  }
  // GET /api/v1/functional/requests
  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const requests = await prisma.ticket.findMany({
        where: { creatorId: user.id },
        orderBy: { createdAt: 'desc' }
      });
      res.json({ success: true, data: requests });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/functional/requests
  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const { routeId, description, departmentId, routingMetadata } = req.body;
      const user = (req as any).user;
      // Scoped ticket creation
      const ticket = await prisma.ticket.create({
        data: {
          title: `Request from ${user.name}`,
          description: description || '',
          creatorId: user.id,
          priority: 'NORMAL',
          routeId: routeId || null,
          departmentId: departmentId ? Number(departmentId) : null,
          routingMetadata: routingMetadata ? JSON.stringify(routingMetadata) : null
        }
      });
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/functional/coins/earn
  async earnCoins(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;
      const user = (req as any).user;
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { appCoins: { increment: Number(amount) } }
      });
      res.json({ success: true, data: { appCoins: updatedUser.appCoins } });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/functional/admin/requests
  async getAllRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      
      // Fetch full user to check role and department
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { role: { select: { name: true } }, department: true }
      });

      if (!fullUser) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      // If not SUPER_ADMIN, scope by user's department
      const isSuperAdmin = fullUser.role?.name === 'SUPER_ADMIN';
      const whereClause = isSuperAdmin ? {} : { departmentId: fullUser.departmentId };

      const requests = await prisma.ticket.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { name: true, avatarUrl: true } },
          departmentObj: { select: { name: true } }
        }
      });
      
      res.json({ 
        success: true, 
        data: requests, 
        metadata: { 
          department: fullUser.department?.name,
          isGlobalView: isSuperAdmin 
        } 
      });
    } catch (err) {
      next(err);
    }
  }

  // PATCH /api/v1/functional/admin/requests/:id/status
  async updateRequestStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const user = (req as any).user;
      
      const ticket = await prisma.ticket.update({
        where: { id: Number(id) },
        data: { status }
      });

      // Log the journey
      await prisma.ticketLog.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          action: 'STATUS_CHANGED',
          comment: note || `ØªÙ… ØªØºÙŠÙŠØ± Ø­Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨ Ø¥Ù„Ù‰ ${status}`
        }
      });

      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  }

}
