export const getSort = (sort?: string) => {
  switch (sort) {
    case "oldest":
      return { createdAt: 1 };

    case "updated":
      return { updatedAt: -1 };

    default:
      return { createdAt: -1 };
  }
};
