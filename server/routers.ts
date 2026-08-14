import { TRPCError } from "@trpc/server";
import { clearSessionCookie, createSessionToken, hashPassword, isValidOwnerAccessToken, setSessionCookie, verifyPassword } from "./sovereign-auth";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { mirrorRouter } from "./mirror-router";
import { portalChatRouter } from "./portal-chat-router";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().email().max(320),
        password: z.string().min(12).max(200),
      }))
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        if (await db.getUserByEmail(email)) {
          throw new TRPCError({ code: "CONFLICT", message: "An account already exists for that email." });
        }

        const passwordHash = await hashPassword(input.password);
        const user = await db.createSovereignUser({ email, name: input.name, passwordHash });
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account creation failed." });

        setSessionCookie(ctx.req, ctx.res, await createSessionToken({ userId: user.id, name: user.name || input.name }));
        return user;
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().trim().email().max(320),
        password: z.string().min(1).max(200),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user?.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }

        await db.upsertUser({ id: user.id, lastSignedIn: new Date() });
        setSessionCookie(ctx.req, ctx.res, await createSessionToken({ userId: user.id, name: user.name || "Operator" }));
        return user;
      }),

    claimAccount: publicProcedure
      .input(z.object({
        email: z.string().trim().email().max(320),
        name: z.string().trim().min(1).max(120),
        password: z.string().min(12).max(200),
      }))
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const user = await db.getUserByEmail(email);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "No existing account matches that email." });
        if (user.passwordHash) throw new TRPCError({ code: "CONFLICT", message: "That account already has sovereign credentials." });

        const updated = await db.setSovereignCredentials({
          userId: user.id,
          email,
          name: input.name,
          passwordHash: await hashPassword(input.password),
        });
        if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account claim failed." });

        setSessionCookie(ctx.req, ctx.res, await createSessionToken({ userId: updated.id, name: updated.name || input.name }));
        return updated;
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        avatarUrl: z.string().trim().url().refine((value) => value.startsWith("https://"), "Avatar URL must use HTTPS.").max(2048).nullable().optional(),
        avatarGlyph: z.string().trim().max(16).nullable().optional(),
        alienBio: z.string().trim().max(600).nullable().optional(),
        preferredVoice: z.string().trim().max(255).nullable().optional(),
        voiceRate: z.number().int().min(60).max(180).optional(),
        voicePitch: z.number().int().min(50).max(150).optional(),
        customPersona: z.string().trim().max(1000).nullable().optional(),
        customInstructions: z.string().trim().max(2000).nullable().optional(),
        modelTemperature: z.number().int().min(0).max(100).optional(),
        predictiveSensitivity: z.number().int().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updated = await db.updateUserProfile(ctx.user.id, input);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Profile could not be updated." });
        return updated;
      }),

    ownerBootstrap: publicProcedure
      .input(z.object({ token: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        if (!isValidOwnerAccessToken(input.token)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid owner access token." });
        }

        const owner = await db.getUserByName("Tyler Morris") ?? await db.getUserByEmail("tycole716@gmail.com") ?? await db.getUserByEmail("tychomorr@gmail.com");
        if (!owner) throw new TRPCError({ code: "NOT_FOUND", message: "Owner account is not provisioned." });

        const promoted = await db.promoteUserToOwner(owner.id);
        if (!promoted) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Owner session could not be created." });

        setSessionCookie(ctx.req, ctx.res, await createSessionToken({ userId: promoted.id, name: "Tyler Morris" }));
        return promoted;
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      clearSessionCookie(ctx.req, ctx.res);
      return { success: true } as const;
    }),
  }),

  // Mirror Reflection Router (Primary Feature)
  mirror: mirrorRouter,



  // Knowledge Graph Router (Secondary Feature)
  kg: router({
    // Fact management
    addFact: protectedProcedure
      .input(z.object({
        subject: z.string().min(1),
        predicate: z.string().min(1),
        object: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.addFact(ctx.user.id, input.subject, input.predicate, input.object);
      }),

    removeFact: protectedProcedure
      .input(z.object({
        subject: z.string(),
        predicate: z.string(),
        object: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeFact(ctx.user.id, input.subject, input.predicate, input.object);
      }),

    getFacts: protectedProcedure
      .input(z.object({
        subject: z.string().optional(),
        predicate: z.string().optional(),
        object: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getFacts(ctx.user.id, input.subject, input.predicate, input.object);
      }),

    // Ontology management
    defineClass: protectedProcedure
      .input(z.object({
        className: z.string().min(1),
        parentClassName: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.defineClass(ctx.user.id, input.className, input.parentClassName);
      }),

    getClasses: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getClasses(ctx.user.id);
      }),

    removeClass: protectedProcedure
      .input(z.object({
        className: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeClass(ctx.user.id, input.className);
      }),

    defineProperty: protectedProcedure
      .input(z.object({
        propertyName: z.string().min(1),
        domain: z.string().optional(),
        range: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.defineProperty(ctx.user.id, input.propertyName, input.domain, input.range);
      }),

    getProperties: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getProperties(ctx.user.id);
      }),

    removeProperty: protectedProcedure
      .input(z.object({
        propertyName: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.removeProperty(ctx.user.id, input.propertyName);
      }),

    // Semantic indexing
    associateInstance: protectedProcedure
      .input(z.object({
        instanceName: z.string().min(1),
        className: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        return await db.associateInstance(ctx.user.id, input.instanceName, input.className);
      }),

    getEntityTypes: protectedProcedure
      .input(z.object({
        instanceName: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        return await db.getEntityTypes(ctx.user.id, input.instanceName);
      }),

    // Query interface
    executeQuery: protectedProcedure
      .input(z.object({
        query: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const query = input.query.toLowerCase().trim();

        if (query.startsWith("get facts where")) {
          const parts = input.query.split("where ")[1];
          const conditions = parts.split(" and ");
          let subject: string | undefined;
          let predicate: string | undefined;
          let object: string | undefined;

          for (const condition of conditions) {
            if (condition.toLowerCase().includes("subject is")) {
              subject = condition.split("is ")[1].trim().replace(/['"]/g, "");
            } else if (condition.toLowerCase().includes("predicate is")) {
              predicate = condition.split("is ")[1].trim().replace(/['"]/g, "");
            } else if (condition.toLowerCase().includes("object is")) {
              object = condition.split("is ")[1].trim().replace(/['"]/g, "");
            }
          }

          return {
            type: "facts",
            data: await db.getFacts(ctx.user.id, subject, predicate, object),
          };
        } else if (query.startsWith("get types of")) {
          const entityName = input.query.split("of ")[1].trim().replace(/['"]/g, "");
          return {
            type: "types",
            data: await db.getEntityTypes(ctx.user.id, entityName),
          };
        }

        return {
          type: "error",
          data: "Invalid query format",
        };
      }),

    // Inference
    checkTransitiveProperty: protectedProcedure
      .input(z.object({
        entity1: z.string(),
        property: z.string(),
        entity2: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const facts = await db.getFacts(ctx.user.id);

        // Check if there's a direct path from entity1 to entity2 via the property
        const hasDirectEdge = facts.some(
          f => f.subject === input.entity1 && f.predicate === input.property && f.object === input.entity2
        );

        if (hasDirectEdge) {
          return {
            result: true,
            path: [input.entity1, input.entity2],
          };
        }

        // Check for transitive paths (simplified: only 2-hop paths)
        for (const fact of facts) {
          if (fact.subject === input.entity1 && fact.predicate === input.property) {
            const intermediate = fact.object;
            const hasSecondHop = facts.some(
              f => f.subject === intermediate && f.predicate === input.property && f.object === input.entity2
            );
            if (hasSecondHop) {
              return {
                result: true,
                path: [input.entity1, intermediate, input.entity2],
              };
            }
          }
        }

        return {
          result: false,
          path: null,
        };
      }),

    checkSubclass: protectedProcedure
      .input(z.object({
        className: z.string(),
        parentClassName: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const classes = await db.getClasses(ctx.user.id);

        const findParent = (name: string): boolean => {
          const cls = classes.find(c => c.className === name);
          if (!cls) return false;
          if (cls.parentClassName === input.parentClassName) return true;
          if (cls.parentClassName) return findParent(cls.parentClassName);
          return false;
        };

        return {
          result: findParent(input.className),
        };
      }),
  }),

  // Subscription and Portal Router
  subscription: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        tier: z.enum(["mirror", "portal"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createCheckoutSession } = await import("./stripe");
        const origin = ctx.req.headers.origin || "https://sovereignapp-hkcgwye7.manus.space";
        
        try {
          const result = await createCheckoutSession(
            ctx.user.id,
            ctx.user.email || "",
            ctx.user.name || "User",
            input.tier,
            origin
          );
          return result;
        } catch (error) {
          console.error("Checkout session creation failed:", error);
          throw error;
        }
      }),

    getSubscription: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserSubscription } = await import("./stripe");
        return await getUserSubscription(ctx.user.id);
      }),

    updateTier: protectedProcedure
      .input(z.object({
        newTier: z.enum(["mirror", "portal"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getUserSubscription, updateSubscriptionTier } = await import("./stripe");
        const subscription = await getUserSubscription(ctx.user.id);
        
        if (!subscription) {
          throw new Error("No active subscription");
        }

        const success = await updateSubscriptionTier(subscription.stripeSubscriptionId, input.newTier);
        return { success };
      }),

    cancelSubscription: protectedProcedure
      .mutation(async ({ ctx }) => {
        const { getUserSubscription, cancelSubscription } = await import("./stripe");
        const subscription = await getUserSubscription(ctx.user.id);
        
        if (!subscription) {
          throw new Error("No active subscription");
        }

        const success = await cancelSubscription(subscription.stripeSubscriptionId);
        return { success };
      }),
  }),

  // Portal Router (Recursive, Reflective Intelligence)
  portal: router({
    reflect: protectedProcedure
      .input(z.object({
        input: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const { getUserSubscription } = await import("./stripe");
        const { portalReflection } = await import("./portal");

        // Check if user has Portal subscription
        const subscription = await getUserSubscription(ctx.user.id);
        if (!subscription || subscription.tier !== "portal") {
          throw new Error("Portal access requires Portal subscription");
        }

        const result = await portalReflection(ctx.user.id, input.input);
        if (!result) {
          throw new Error("Portal reflection failed");
        }
        return result;
      }),

    getSummary: protectedProcedure
      .query(async ({ ctx }) => {
        const { getUserSubscription } = await import("./stripe");
        const { getPortalSummary } = await import("./portal");

        // Check if user has Portal subscription
        const subscription = await getUserSubscription(ctx.user.id);
        if (!subscription || subscription.tier !== "portal") {
          return null;
        }

        return await getPortalSummary(ctx.user.id);
      }),

    // Portal Chat procedures
    chat: portalChatRouter,
  }),
});

export type AppRouter = typeof appRouter;
