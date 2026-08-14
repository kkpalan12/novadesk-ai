type SanitizableUser =
  | {
      toObject?: () => Record<string, unknown>;
    }
  | Record<string, unknown>;

export const sanitizeUser = (user: SanitizableUser | null | undefined) => {
  if (!user) {
    return user;
  }

  const userObject =
    "toObject" in user && typeof user.toObject === "function"
      ? user.toObject()
      : user;

  const {
    password,
    refreshToken,
    resetPasswordToken,
    resetPasswordExpires,
    __v,
    ...safeUser
  } = userObject;

  return safeUser;
};
