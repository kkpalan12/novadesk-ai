export const sanitizeUser = (user: any) => {
  const userObject =
    typeof user?.toObject === "function" ? user.toObject() : user;

  if (!userObject) {
    return userObject;
  }

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
