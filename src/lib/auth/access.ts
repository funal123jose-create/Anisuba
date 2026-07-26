type AccessContext = {
  isAdmin: boolean;
  isDemo: boolean;
  environment?: string;
};

export function canAccessAdminArea({
  isAdmin,
  isDemo,
  environment = process.env.NODE_ENV,
}: AccessContext) {
  return isAdmin || (environment !== "production" && isDemo);
}

export const canAccessDeveloperTools = canAccessAdminArea;
