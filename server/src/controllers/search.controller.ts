import { Request, Response } from "express";

import { SearchService } from "../services/search.service";
import { ApiResponse } from "../common/responses/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export class SearchController {
  private readonly searchService = new SearchService();

  search = asyncHandler(async (req: Request, res: Response) => {
    const query = String(req.query.q || "").trim();

    const result = await this.searchService.search(req.user!.userId, query);

    return res
      .status(200)
      .json(new ApiResponse(true, "Search completed successfully", result));
  });
}
