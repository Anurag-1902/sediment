import { TRPCError } from "@trpc/server";

export async function getOrgContext(ctx: { getPrisma: () => Promise<any>; session: { user: { id: string } } }) {
  const prisma = await ctx.getPrisma();
  const userId = ctx.session.user.id;

  // Get the user's organization memberships
  const memberships = await prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true },
  });

  if (memberships.length === 0) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User is not a member of any organization. Create or join one first.",
    });
  }

  // For now, return the first org (or the user could select which org to work in)
  const org = memberships[0].organization;

  return {
    organizationId: org.id,
    organizationName: org.name,
    userRole: memberships[0].role,
  };
}
