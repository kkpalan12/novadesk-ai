import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  MAX_LIMIT,
} from "../common/constants/constants";

export const getPagination = (query: any) => {
  const page = Math.max(Number(query.page) || DEFAULT_PAGE, 1);

  const limit = Math.min(Number(query.limit) || DEFAULT_LIMIT, MAX_LIMIT);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};
