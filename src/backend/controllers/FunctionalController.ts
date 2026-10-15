import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

export class FunctionalController {
  
  // GET /api/v1/functional/me
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          role: { select: { name: true } },
          department: { select: { name: true } },
          appCoins: true
        }
      });

      if (!userData) return res.status(404).json({ success: false, message: 'User not found' });

      res.json({
        success: true,
        data: {
          id: String(userData.id),
          name: userData.fullName || userData.username,
          email: userData.email,
          role: userData.role?.name || "",
          department: userData.department?.name || "",
          points: 0,
          appCoins: userData.appCoins || 0,
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
        if (!fullUser?.departmentId) return res.status(403).json({ success: false, message: 'Not authorized: No department' });
        const auth = await prisma.publishingAuthority.findUnique({ where: { departmentId: fullUser.departmentId } });
        if (!auth || !auth.canPublishNews) return res.status(403).json({ success: false, message: 'Not authorized to publish news' });
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
        include: {
          author: { select: { fullName: true, username: true, avatarUrl: true, department: { select: { name: true } } } }
        }
      });
      res.json({ success: true, data: posts });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/v1/functional/challenges
  async getChallenges(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const challenges = await prisma.challenge.findMany({
        where: { isActive: true },
        include: {
          department: { select: { name: true } },
          participations: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
          completions: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } }
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
            id: String(p.userId),
            name: p.user.fullName || 'User',
            avatar: p.user.avatarUrl || 'https://i.pravatar.cc/150'
          })),
          completedBy: ch.completions.map(c => ({
            id: String(c.userId),
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

  // POST /api/v1/functional/challenges
  async createChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, category, challengeType, deadline, rewardPoints, badge, iconName } = req.body;
      const user = (req as any).user;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { departmentId: true, role: { select: { name: true } } }
      });

      if (fullUser?.role?.name !== 'SUPER_ADMIN') {
        if (!fullUser?.departmentId) return res.status(403).json({ success: false, message: 'Not authorized: No department' });
        const auth = await prisma.publishingAuthority.findUnique({ where: { departmentId: fullUser.departmentId } });
        if (!auth || !auth.canPublishChallenges) return res.status(403).json({ success: false, message: 'Not authorized to publish challenges' });
      }

      const newChallenge = await prisma.challenge.create({
        data: {
          title,
          description,
          category,
          departmentId: fullUser?.departmentId || null,
          challengeType,
          deadline: new Date(deadline),
          rewardPoints: Number(rewardPoints),
          badge,
          iconName
        }
      });
      res.json({ success: true, data: newChallenge });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/v1/functional/challenges/:id/join
  async joinChallenge(req: Request, res: Response, next: NextFunction) {
    try {
      const challengeId = req.params.id;
      const user = (req as any).user;
      const existing = await prisma.challengeParticipation.findUnique({ where: { challengeId_userId: { challengeId, userId: user.id } } });
      if (!existing) await prisma.challengeParticipation.create({ data: { challengeId, userId: user.id } });
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
      
      const challenge = await prisma.challenge.findUnique({ where: { id: challengeId }, include: { completions: true } });
      if (!challenge) return res.status(404).json({ success: false, message: 'Challenge not found' });

      const existing = await prisma.challengeCompletion.findUnique({ where: { challengeId_userId: { challengeId, userId: user.id } } });
      if (existing) return res.status(400).json({ success: false, message: 'Already completed' });

      const earlyBirdClaimed = challenge.completions.filter(c => c.isEarlyBird).length;
      const isEarlyBird = challenge.earlyBirdQuota ? (earlyBirdClaimed < challenge.earlyBirdQuota) : false;
      
      let pointsToAward = challenge.rewardPoints;
      if (isEarlyBird && challenge.earlyBirdBonus) pointsToAward += challenge.earlyBirdBonus;

      await prisma.challengeCompletion.create({
        data: {
          challengeId,
          userId: user.id,
          pointsAwarded: pointsToAward,
          isEarlyBird,
          isFirstTry: true
        }
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
        include: { unlocks: { where: { userId: user.id } } }
      });
      const formatted = perks.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        coinCost: p.coinCost,
        iconName: p.iconName,
        category: p.category,
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
      const perk = await prisma.appPerk.findUnique({ where: { id: perkId } });
      if (!perk) return res.status(404).json({ success: false, message: 'Perk not found' });
      const existing = await prisma.appPerkUnlock.findUnique({ where: { userId_perkId: { userId: user.id, perkId: perk.id } } });
      if (existing) return res.status(400).json({ success: false, message: 'Already unlocked' });

      await prisma.appPerkUnlock.create({ data: { userId: user.id, perkId: perk.id } });
      res.json({ success: true, message: 'Perk unlocked' });
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

  // ─────────────────────────────────────────────────────────────────────────────
  // POSTS (Social Feed)
  // ─────────────────────────────────────────────────────────────────────────────

  /** POST /api/v1/functional/posts */
  async createPost(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { content, mediaUrl, mediaUrls } = req.body;
      const post = await prisma.employeePost.create({
        data: { content, mediaUrls: mediaUrls || mediaUrl || null, authorId: Number(user.id) }
      });
      res.status(201).json({ success: true, data: post });
    } catch (err) { next(err); }
  }

  /** POST /api/v1/functional/posts/:id/react */
  async reactToPost(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const postId = req.params.id;
      const { reaction = 'LIKE', type } = req.body;
      const reactionType = type || reaction;
      const existing = await prisma.postReaction.findUnique({ where: { postId_userId: { postId, userId: Number(user.id) } } });
      if (existing) {
        await prisma.postReaction.delete({ where: { postId_userId: { postId, userId: Number(user.id) } } });
        return res.json({ success: true, action: 'removed' });
      }
      await prisma.postReaction.create({ data: { postId, userId: Number(user.id), type: reactionType } });
      res.json({ success: true, action: 'added' });
    } catch (err) { next(err); }
  }

  /** POST /api/v1/functional/posts/:id/comment */
  async commentOnPost(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const postId = req.params.id;
      const { content, body } = req.body;
      const commentText = body || content;
      if (!commentText?.trim()) return res.status(400).json({ success: false, message: 'content مطلوب' });
      const comment = await prisma.postComment.create({ data: { postId, authorId: Number(user.id), body: commentText } });
      res.status(201).json({ success: true, data: comment });
    } catch (err) { next(err); }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // REELS (Media Feed)
  // ─────────────────────────────────────────────────────────────────────────────

  /** GET /api/v1/functional/reels */
  async getReels(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const reels = await prisma.mediaReel.findMany({
        include: {
          reactions: true,
          comments: { include: { author: { select: { fullName: true, avatarUrl: true } } }, take: 5 }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      const data = reels.map(r => ({
        ...r,
        likesCount: r.reactions?.length || 0,
        hasLiked: r.reactions?.some((rx: any) => rx.userId === Number(user.id)) || false,
      }));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** POST /api/v1/functional/reels/:id/react */
  async reactToReel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const reelId = req.params.id;
      const existing = await prisma.reelReaction.findUnique({ where: { reelId_userId: { reelId, userId: Number(user.id) } } });
      if (existing) {
        await prisma.reelReaction.delete({ where: { reelId_userId: { reelId, userId: Number(user.id) } } });
        return res.json({ success: true, action: 'removed' });
      }
      await prisma.reelReaction.create({ data: { reelId, userId: Number(user.id), type: 'LIKE' } });
      res.json({ success: true, action: 'added' });
    } catch (err) { next(err); }
  }

  /** POST /api/v1/functional/reels/:id/comment */
  async commentOnReel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const reelId = req.params.id;
      const { content, body } = req.body;
      const commentText = body || content;
      if (!commentText?.trim()) return res.status(400).json({ success: false, message: 'content مطلوب' });
      const comment = await prisma.reelComment.create({ data: { reelId, authorId: Number(user.id), body: commentText } });
      res.status(201).json({ success: true, data: comment });
    } catch (err) { next(err); }
  }


  // ─────────────────────────────────────────────────────────────────────────────
  // TICKET / REQUEST ENGINE  (linked to TicketRouteDefinition)
  // ─────────────────────────────────────────────────────────────────────────────

  /** POST /api/v1/tickets  — إنشاء طلب جديد عبر مسار محدد */
  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      let {
        routeId, title, description = '',
        taxonomyMain, taxonomySub,
        buildingId, departmentId,
        fields = {},
        flowDefinitionId,
      } = req.body;

      if (!routeId && flowDefinitionId) routeId = flowDefinitionId;
      if (!routeId) return res.status(400).json({ success: false, message: 'routeId مطلوب' });
      if (!title?.trim()) {
        title = req.body.flowTitle || req.body.subject || `طلب - ${new Date().toLocaleDateString('ar-LY')}`;
      }

      // Fetch or create the default "OPEN" state
      let openState = await prisma.ticketState.findFirst({ where: { name: 'OPEN' } });
      if (!openState) {
        openState = await prisma.ticketState.create({ data: { name: 'OPEN', label: 'مفتوح' } });
      }

      // Fetch or create a default "General" category
      let defaultCategory = await prisma.issueCategory.findFirst({ where: { isDeleted: false } });
      if (!defaultCategory) {
        defaultCategory = await prisma.issueCategory.create({ data: { name: 'عام' } });
      }

      // Resolve route definition from litc_ticket_routes in DB if routeId is provided
      let matchedRoute: any = null;
      if (routeId) {
        try {
          const setting = await prisma.systemSetting.findUnique({
            where: { settingKey: 'litc_ticket_routes' }
          });
          if (setting?.settingValue) {
            const routes = JSON.parse(setting.settingValue);
            matchedRoute = routes.find((r: any) => r.id === routeId);
          }
        } catch (err) {
          console.error('[FunctionalController] Route lookup error', err);
        }
      }

      // Resolve numeric departmentId if provided or from matched route
      let deptId: number | null = null;
      const targetDeptId = departmentId || matchedRoute?.targetDepartmentId;
      if (targetDeptId) {
        const numId = isNaN(Number(targetDeptId)) ? undefined : Number(targetDeptId);
        const dept = await prisma.department.findFirst({
          where: { OR: [{ id: numId }, { name: targetDeptId.toString() }], isDeleted: false }
        });
        deptId = dept?.id || null;
      }

      // Build complete routing metadata blob (linking route, department, division, team/unit)
      const divisionId = req.body.divisionId || matchedRoute?.targetDivisionId || null;
      const teamId = req.body.teamId || matchedRoute?.targetTeamId || null;
      const targetDepartmentName = req.body.targetDepartmentName || matchedRoute?.targetDepartmentName || null;
      const targetDivisionName = req.body.targetDivisionName || matchedRoute?.targetDivisionName || null;
      const targetTeamName = req.body.targetTeamName || matchedRoute?.targetTeamName || null;

      const mergedMeta = {
        routeId,
        routeName: matchedRoute?.name || null,
        taxonomyMain: taxonomyMain || null,
        taxonomySub: taxonomySub || null,
        buildingId: buildingId || null,
        divisionId,
        teamId,
        targetDepartmentName,
        targetDivisionName,
        targetTeamName,
        dynamicFields: fields,
        ...(typeof req.body.routingMetadata === 'object' ? req.body.routingMetadata : {}),
        submittedAt: new Date().toISOString(),
      };

      // Evaluate Automated Workflow Rules for this route/flow
      let autoAssignedTechId: number | null = null;
      let visibleToUserIds: number[] | null = null;

      if (routeId) {
        try {
          const rules = await prisma.flowRoutingRule.findMany({
            where: { flowId: routeId, isActive: true },
            orderBy: { ruleOrder: 'asc' }
          });

          for (const r of rules) {
            let conditions: any[] = [];
            try { conditions = JSON.parse(r.conditionsJson || '[]'); } catch {}
            if (conditions.length === 0) continue;

            const isMatch = conditions.every(c => {
              if (c.fieldId === 'buildingId' || c.fieldName === 'building') {
                return String(buildingId) === String(c.value);
              }
              const userVal = fields && fields[c.fieldId];
              return String(userVal) === String(c.value);
            });

            if (isMatch) {
              let targetIds: number[] = [];
              try { targetIds = JSON.parse(r.targetUserIds || '[]'); } catch {}
              if (targetIds.length === 0) continue;

              if (r.actionType === 'DIRECT_ASSIGN' && !autoAssignedTechId) {
                autoAssignedTechId = targetIds[0];
              } else if (r.actionType === 'ROUND_ROBIN' && !autoAssignedTechId) {
                const lastId = r.lastAssignedUserId;
                let nextIdx = 0;
                if (lastId && targetIds.includes(lastId)) {
                  nextIdx = (targetIds.indexOf(lastId) + 1) % targetIds.length;
                }
                autoAssignedTechId = targetIds[nextIdx];
                await prisma.flowRoutingRule.update({
                  where: { id: r.id },
                  data: { lastAssignedUserId: autoAssignedTechId }
                }).catch(() => {});
              } else if (r.actionType === 'VISIBILITY_FILTER') {
                visibleToUserIds = targetIds;
              }
            }
          }
        } catch (ruleErr) {
          console.error('[FunctionalController] Workflow rules evaluation error:', ruleErr);
        }
      }

      if (visibleToUserIds) {
        (mergedMeta as any).visibleToUserIds = visibleToUserIds;
      }
      if (autoAssignedTechId) {
        (mergedMeta as any).autoAssignedTechId = autoAssignedTechId;
      }

      const routingMetadata = JSON.stringify(mergedMeta);
      const reqPriority = (req.body.priority || 'MEDIUM').toUpperCase();

      const ticket = await prisma.ticket.create({
        data: {
          title: title.trim(),
          description: description.trim() || title.trim(),
          stateId: openState.id,
          categoryId: defaultCategory.id,
          creatorId: user.id,
          departmentId: deptId,
          routeId: routeId,
          flowDefinitionId: routeId,
          priority: reqPriority,
          requesterPriority: reqPriority,
          routingMetadata,
          ticketType: 'EMPLOYEE_REQUEST',
          channel: 'PORTAL',
        }
      });

      // If auto-assigned to a technician via rule
      if (autoAssignedTechId) {
        await prisma.ticketAssignment.create({
          data: {
            ticketId: ticket.id,
            assignedTechId: autoAssignedTechId,
            isCurrentActive: true
          }
        }).catch(e => console.error('[FunctionalController] Auto-assign error:', e));

        await prisma.ticketLog.create({
          data: {
            ticketId: ticket.id,
            action: `AUTO_ASSIGN: تم إسناد الطلب تلقائياً للموظف ID:${autoAssignedTechId} بناءً على محرك الأتمتة الشرطي للمسار.`
          }
        }).catch(() => {});
      }

      return res.status(201).json({
        success: true,
        message: 'تم إرسال الطلب بنجاح',
        data: {
          id: ticket.id,
          title: ticket.title,
          routeId: ticket.routeId,
          status: openState.label,
          createdAt: ticket.createdAt,
        }
      });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/functional/requests — طلبات الموظف الحالي */
  async getMyRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const tickets = await prisma.ticket.findMany({
        where: {
          creatorId: user.id,
          isDeleted: false,
          parentId: null // تظهر الطلبات الأساسية فقط، والتذاكر الفرعية تظهر متفرعة بداخلها
        },
        include: {
          state: true,
          departmentObj: { select: { id: true, name: true } },
          rating: true,
          assignments: {
            where: { isCurrentActive: true },
            include: { assignedTech: { select: { id: true, fullName: true, avatarUrl: true } } }
          },
          subTickets: {
            where: { isDeleted: false },
            include: {
              state: true,
              departmentObj: { select: { id: true, name: true } },
              assignments: {
                where: { isCurrentActive: true },
                include: { assignedTech: { select: { id: true, fullName: true } } }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const data = tickets.map(t => {
        let routingMeta: any = {};
        try { routingMeta = t.routingMetadata ? JSON.parse(t.routingMetadata) : {}; } catch {}

        const stateName = t.state?.name || 'OPEN';
        let uiStatus = 'pending';
        if (stateName === 'CLOSED' || stateName === 'RESOLVED') uiStatus = 'completed';
        else if (stateName === 'REJECTED') uiStatus = 'rejected';
        else if (stateName === 'IN_PROGRESS') uiStatus = 'in_progress';

        const primaryAssignee = t.assignments?.[0]?.assignedTech?.fullName || t.departmentObj?.name || 'مستلم الطلب الرئيسي';

        const formattedSubTickets = (t.subTickets || []).map((st: any) => {
          const isDone = ['CLOSED', 'RESOLVED'].includes(st.state?.name);
          return {
            id: st.id,
            title: st.title.replace(/^\[مهمة فرعية\]\s*/, ''),
            department: st.departmentObj?.name || 'جهة غير محددة',
            assignedTech: st.assignments?.[0]?.assignedTech?.fullName || null,
            status: st.state?.label || st.state?.name || 'قيد المعالجة',
            statusName: st.state?.name,
            isClosed: isDone,
            createdAt: st.createdAt,
            updatedAt: st.updatedAt,
          };
        });

        const hasOpenSubTickets = formattedSubTickets.some(st => !st.isClosed);

        return {
          id: t.id.toString(),
          code: `REQ-${String(t.id).padStart(4, '0')}`,
          title: t.title,
          titleEn: t.title,
          description: t.description,
          routeId: t.routeId,
          categoryId: t.routeId || 'general',
          department: t.departmentObj?.name || 'عام',
          departmentEn: t.departmentObj?.name || 'General',
          date: new Date(t.createdAt).toLocaleDateString('ar-LY'),
          status: uiStatus,
          statusLabel: t.state?.label || 'قيد الانتظار',
          statusLabelEn: stateName,
          statusName: stateName,
          stage: t.state?.label || 'المراجعة الأولية',
          stageEn: stateName,
          rating: t.rating?.rating,
          feedback: t.rating?.feedback,
          primaryAssignee,
          subTickets: formattedSubTickets,
          hasOpenSubTickets,
          steps: [
            {
              id: 's1',
              label: 'تم تقديم الطلب',
              labelEn: 'Request Submitted',
              status: 'completed',
              timestamp: new Date(t.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' }),
            },
            {
              id: 's2',
              label: hasOpenSubTickets ? 'تذاكر فرعية قيد المعالجة' : (t.state?.label || 'قيد المعالجة'),
              labelEn: stateName,
              status: uiStatus === 'completed' ? 'completed' : uiStatus === 'rejected' ? 'failed' : 'current',
            }
          ],
          routingMeta,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      });

      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  /** GET /api/v1/functional/admin/requests — جميع الطلبات (للأدمن) */
  async getAllRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, routeId, page = 1, limit = 50 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = { ticketType: 'EMPLOYEE_REQUEST', isDeleted: false };
      if (status) where.state = { name: (status as string).toUpperCase() };
      if (routeId) where.routeId = routeId as string;

      const [tickets, total] = await Promise.all([
        prisma.ticket.findMany({
          where,
          include: {
            state: true,
            creator: { select: { fullName: true, email: true, avatarUrl: true, department: { select: { name: true } } } },
            departmentObj: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.ticket.count({ where }),
      ]);

      const data = tickets.map(t => {
        let routingMeta: any = {};
        try { routingMeta = t.routingMetadata ? JSON.parse(t.routingMetadata) : {}; } catch {}
        return {
          id: t.id,
          title: t.title,
          description: t.description,
          routeId: t.routeId,
          status: t.state.label,
          statusName: t.state.name,
          requester: {
            name: t.creator?.fullName || 'موظف',
            email: t.creator?.email || '',
            avatar: t.creator?.avatarUrl || null,
            department: t.creator?.department?.name || null,
          },
          targetDepartment: t.departmentObj?.name || null,
          routingMeta,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        };
      });

      res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
      next(err);
    }
  }

  /** PATCH /api/v1/functional/admin/requests/:id/status — تحديث حالة الطلب */
  async updateRequestStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, resolutionNotes } = req.body;

      if (!status) return res.status(400).json({ success: false, message: 'status مطلوب' });

      const ticketId = parseInt(id);
      if (isNaN(ticketId)) return res.status(400).json({ success: false, message: 'ID غير صالح' });

      const statusUpper = status.toUpperCase();

      if (statusUpper === 'CLOSED' || statusUpper === 'RESOLVED') {
        const openSubTickets = await prisma.ticket.findMany({
          where: {
            parentId: ticketId,
            isDeleted: false,
            state: { name: { notIn: ['CLOSED', 'RESOLVED'] } }
          },
          include: { departmentObj: true }
        });
        if (openSubTickets.length > 0) {
          const depts = openSubTickets.map(s => s.departmentObj?.name || 'جهة غير محددة').join('، ');
          return res.status(400).json({
            success: false,
            message: `لا يمكن إغلاق أو اعتماد اكتمال التذكرة لوجود (${openSubTickets.length}) مهام فرعية ما زالت قيد المعالجة لدى: ${depts}. يجب أن يقوم الطرف المستلم بقفلها أولاً.`
          });
        }
      }

      const labelMap: Record<string, string> = {
        'OPEN': 'مفتوح', 'IN_PROGRESS': 'قيد التنفيذ',
        'RESOLVED': 'تم الحل', 'CLOSED': 'مغلق', 'REJECTED': 'مرفوض'
      };

      let state = await prisma.ticketState.findFirst({ where: { name: statusUpper } });
      if (!state) {
        state = await prisma.ticketState.create({
          data: { name: statusUpper, label: labelMap[statusUpper] || status }
        });
      }

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { stateId: state.id, resolutionNotes: resolutionNotes || null },
        include: { state: true }
      });

      res.json({
        success: true,
        message: 'تم تحديث حالة الطلب',
        data: { id: updated.id, status: updated.state.label, statusName: updated.state.name }
      });
    } catch (err) {
      next(err);
    }
  }

  /** POST /api/v1/functional/requests/:id/rate-close — تقييم الطلب وإغلاقه من قبل الموظف */
  async rateAndCloseRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) return res.status(400).json({ success: false, message: 'Invalid ticket ID' });

      const { rating, feedback } = req.body;
      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        return res.status(400).json({ success: false, message: 'التقييم يجب أن يكون بين 1 و 5 نجوم' });
      }

      // Verify the ticket belongs to the user
      const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, creatorId: user.id }
      });
      if (!ticket) {
        return res.status(404).json({ success: false, message: 'الطلب غير موجود أو غير تابع لك' });
      }

      // التحقق من عدم وجود تذاكر فرعية مفتوحة قبل الإغلاق
      const openSubTickets = await prisma.ticket.count({
        where: {
          parentId: ticket.id,
          isDeleted: false,
          state: { name: { notIn: ['CLOSED', 'RESOLVED'] } }
        }
      });
      if (openSubTickets > 0) {
        return res.status(400).json({
          success: false,
          message: `لا يمكن تقييم وإغلاق الطلب نهائياً لوجود (${openSubTickets}) مهام فرعية ما زالت قيد التنفيذ من قبل الأطراف المستلمة. يرجى الانتظار حتى استكمال كافة المهام.`
        });
      }

      // Find or create CLOSED state
      let closedState = await prisma.ticketState.findFirst({ where: { name: 'CLOSED' } });
      if (!closedState) {
        closedState = await prisma.ticketState.create({
          data: { name: 'CLOSED', label: 'مغلق ومكتمل' }
        });
      }

      // Upsert rating
      const savedRating = await prisma.ticketRating.upsert({
        where: { ticketId: ticket.id },
        update: { rating: numRating, feedback: feedback || null },
        create: { ticketId: ticket.id, rating: numRating, feedback: feedback || null }
      });

      // Update ticket to CLOSED state
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { stateId: closedState.id }
      });

      // Add a journey log
      await prisma.ticketLog.create({
        data: {
          ticketId: ticket.id,
          action: `USER_RATED_AND_CLOSED: قام الموظف بتقييم الخدمة (${numRating} نجوم) وإغلاق التذكرة نهائياً.`
        }
      }).catch(() => {});

      res.json({
        success: true,
        message: 'تم تسجيل التقييم وإغلاق الطلب بنجاح',
        data: {
          ticketId: ticket.id,
          rating: savedRating.rating,
          feedback: savedRating.feedback,
          status: 'completed',
          statusName: 'CLOSED',
          statusLabel: closedState.label
        }
      });
    } catch (err) {
      next(err);
    }
  }

}
