import { Router, Request, Response } from "express";

const indexRouter = Router();

indexRouter.get("/", (req: Request, res: Response) => {
  res.json({
    statusCode: 200,
    message: "Welcome to paylink celo API",
  });
});

export default indexRouter;
