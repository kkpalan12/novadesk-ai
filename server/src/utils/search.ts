export const buildSearchQuery = (search?: string, fields: string[] = []) => {
  if (!search) return {};

  return {
    $or: fields.map((field) => ({
      [field]: {
        $regex: search,
        $options: "i",
      },
    })),
  };
};
