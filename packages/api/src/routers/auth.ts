import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { db } from "@asaselink/db";
import {
  users,
  buyerProfiles,
  companyMembers,
  companies,
  companyApplications,
  type User,
} from "@asaselink/db/schema";
import { eq } from "drizzle-orm";
import { protectedProcedure } from "../index";

export const authRouter = {
  syncUser: protectedProcedure
    .input(
      z
        .object({
          intent: z.string().optional(),
          returnUrl: z.string().optional(),
          email: z.string().optional(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          phoneNumber: z.string().optional(),
        })
        .optional(),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) {
        throw new ORPCError("UNAUTHORIZED");
      }

      let userRecord: User | null = null;

      try {
        // 1. Idempotently find or create user in AsaseLink DB
        const existingUsers = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkId))
          .limit(1);

        if (existingUsers.length > 0 && existingUsers[0]) {
          userRecord = existingUsers[0];
          // Update details if newly provided
          if (input?.email || input?.firstName || input?.lastName || input?.phoneNumber) {
            const updated = await db
              .update(users)
              .set({
                email: input.email || userRecord.email,
                firstName: input.firstName || userRecord.firstName,
                lastName: input.lastName || userRecord.lastName,
                phoneNumber: input.phoneNumber || userRecord.phoneNumber,
                updatedAt: new Date(),
              })
              .where(eq(users.id, userRecord.id))
              .returning();
            if (updated[0]) userRecord = updated[0];
          }
        } else {
          const inserted = await db
            .insert(users)
            .values({
              clerkId,
              email: input?.email ?? null,
              firstName: input?.firstName ?? null,
              lastName: input?.lastName ?? null,
              phoneNumber: input?.phoneNumber ?? null,
              status: "active",
              isAdmin: false,
            })
            .returning();
          userRecord = inserted[0] ?? null;
        }

        if (!userRecord) {
          throw new Error("Could not initialize user record");
        }

        // 2. Ensure buyer profile row exists
        const existingProfiles = await db
          .select()
          .from(buyerProfiles)
          .where(eq(buyerProfiles.userId, userRecord.id))
          .limit(1);

        let profileRecord = existingProfiles[0] || null;
        if (!profileRecord) {
          const insertedProfile = await db
            .insert(buyerProfiles)
            .values({
              userId: userRecord.id,
              firstName: userRecord.firstName,
              lastName: userRecord.lastName,
              phoneNumber: userRecord.phoneNumber,
              communicationConsent: false,
              completedAt: null,
            })
            .returning();
          profileRecord = insertedProfile[0] || null;
        }

        // 3. Check company applications
        const userApplications = await db
          .select()
          .from(companyApplications)
          .where(eq(companyApplications.applicantUserId, userRecord.id));

        // 4. Check company memberships
        const userMemberships = await db
          .select({
            member: companyMembers,
            company: companies,
          })
          .from(companyMembers)
          .innerJoin(companies, eq(companyMembers.companyId, companies.id))
          .where(eq(companyMembers.userId, userRecord.id));

        // 5. Deterministic Continuation Resolver (Section 4 of PHASE_1_AUTH_FOUNDATION.md)
        let nextDestination = "/account";

        // A. Suspended or restricted
        if (userRecord.status === "suspended" || userRecord.status === "restricted") {
          return {
            user: userRecord,
            status: userRecord.status,
            nextDestination: `/unauthorized?reason=${userRecord.status}`,
          };
        }

        // B. Administrator direct access
        if (userRecord.isAdmin) {
          nextDestination = "/admin";
        }
        // C. Company application intent or existing application
        else if (input?.intent === "company" || userApplications.length > 0) {
          const activeApp = userApplications[0];
          if (!activeApp) {
            nextDestination = "/company/apply";
          } else if (activeApp.currentStep === "submitted") {
            nextDestination = "/company/application";
          } else {
            nextDestination = `/company/apply/${activeApp.currentStep}`;
          }
        }
        // D. Approved company member
        else if (userMemberships.length === 1 && userMemberships[0]) {
          nextDestination = `/company/${userMemberships[0].company.id}/overview`;
        }
        // E. Multiple workspaces
        else if (userMemberships.length > 1) {
          nextDestination = "/workspaces";
        }
        // F. Validate internal return URL if provided
        else if (
          input?.returnUrl &&
          input.returnUrl.startsWith("/") &&
          !input.returnUrl.startsWith("//") &&
          !input.returnUrl.startsWith("/sign-in") &&
          !input.returnUrl.startsWith("/sign-up")
        ) {
          nextDestination = input.returnUrl;
        }
        // G. Uncompleted buyer profile
        else if (!profileRecord?.completedAt) {
          nextDestination = "/onboarding/profile";
        } else {
          nextDestination = "/account";
        }

        return {
          user: userRecord,
          buyerProfile: profileRecord,
          memberships: userMemberships,
          applications: userApplications,
          nextDestination,
        };
      } catch (error) {
        console.error("Error in syncUser procedure:", error);
        throw error;
      }
    }),

  getCurrentUser: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");

    try {
      const userList = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

      const currentUser = userList[0];
      if (!currentUser) return null;

      const profileList = await db
        .select()
        .from(buyerProfiles)
        .where(eq(buyerProfiles.userId, currentUser.id))
        .limit(1);

      const memberships = await db
        .select({
          member: companyMembers,
          company: companies,
        })
        .from(companyMembers)
        .innerJoin(companies, eq(companyMembers.companyId, companies.id))
        .where(eq(companyMembers.userId, currentUser.id));

      return {
        user: currentUser,
        buyerProfile: profileList[0] || null,
        memberships,
      };
    } catch (err) {
      console.error("Error in getCurrentUser:", err);
      throw err;
    }
  }),

  updateBuyerProfile: protectedProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        phoneNumber: z.string().min(8, "Valid phone number is required"),
        communicationConsent: z.boolean().default(false),
      }),
    )
    .handler(async ({ context, input }) => {
      const clerkId = context.auth?.userId;
      if (!clerkId) throw new ORPCError("UNAUTHORIZED");

      try {
        const userList = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

        let userRecord = userList[0];
        if (!userRecord) {
          const inserted = await db
            .insert(users)
            .values({
              clerkId,
              email: input.email,
              firstName: input.firstName,
              lastName: input.lastName,
              phoneNumber: input.phoneNumber,
              status: "active",
            })
            .returning();
          userRecord = inserted[0];
        } else {
          const updatedUsers = await db
            .update(users)
            .set({
              email: input.email ?? userRecord.email,
              firstName: input.firstName,
              lastName: input.lastName,
              phoneNumber: input.phoneNumber,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userRecord.id))
            .returning();
          userRecord = updatedUsers[0] ?? userRecord;
        }

        if (!userRecord) throw new Error("Could not find user record");

        const updated = await db
          .insert(buyerProfiles)
          .values({
            userId: userRecord.id,
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber,
            communicationConsent: input.communicationConsent,
            completedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: buyerProfiles.userId,
            set: {
              firstName: input.firstName,
              lastName: input.lastName,
              phoneNumber: input.phoneNumber,
              communicationConsent: input.communicationConsent,
              completedAt: new Date(),
              updatedAt: new Date(),
            },
          })
          .returning();

        return { success: true, profile: updated[0] };
      } catch (err) {
        console.error("Error updating buyer profile:", err);
        throw err;
      }
    }),

  getWorkspaces: protectedProcedure.handler(async ({ context }) => {
    const clerkId = context.auth?.userId;
    if (!clerkId) throw new ORPCError("UNAUTHORIZED");

    try {
      const userList = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);

      const currentUser = userList[0];
      if (!currentUser) return [];

      const workspaces: Array<{
        id: string;
        type: "buyer" | "company" | "admin";
        name: string;
        role: string;
        url: string;
        isLastActive: boolean;
      }> = [
        {
          id: "buyer",
          type: "buyer",
          name: "Buyer Account",
          role: "Buyer",
          url: "/account",
          isLastActive: true,
        },
      ];

      const memberships = await db
        .select({
          member: companyMembers,
          company: companies,
        })
        .from(companyMembers)
        .innerJoin(companies, eq(companyMembers.companyId, companies.id))
        .where(eq(companyMembers.userId, currentUser.id));

      for (const m of memberships) {
        workspaces.push({
          id: m.company.id,
          type: "company" as const,
          name: m.company.legalName,
          role: m.member.role,
          url: `/company/${m.company.id}/overview`,
          isLastActive: false,
        });
      }

      if (currentUser.isAdmin) {
        workspaces.push({
          id: "admin",
          type: "admin" as const,
          name: "Platform Administration",
          role: "Administrator",
          url: "/admin",
          isLastActive: false,
        });
      }

      return workspaces;
    } catch (err) {
      console.error("Error getting workspaces:", err);
      throw err;
    }
  }),
};
