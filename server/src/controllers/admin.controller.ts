import { Request, Response } from "express";
import { ApiResponse } from "../common/responses/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export class AdminController {

    dashboard = asyncHandler(

        async (req: Request, res: Response) => {

            res.status(200).json(

                new ApiResponse(

                    true,

                    "Welcome Admin",

                    {
                        loggedInUser: req.user
                    }

                )

            );

        }

    );

}