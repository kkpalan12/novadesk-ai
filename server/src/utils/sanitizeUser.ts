export const sanitizeUser = (user: any) => {
  const userObject = user.toObject();

  const {
    password,
    refreshToken,
    __v,
    ...safeUser
  } = userObject;

  return safeUser;
};