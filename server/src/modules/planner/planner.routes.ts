import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validate } from "../../middleware/validate";
import { getStudyEstimate } from "./planner.service";

const router = Router();

const estimateQuerySchema = z.object({
  currentLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  targetLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  pace: z.enum(["regular", "intensive", "speed"]).default("regular"),
});

// GET /api/planner/estimate?currentLevel=A1&targetLevel=B1&pace=regular
router.get(
  "/estimate",
  validate({ query: estimateQuerySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentLevel, targetLevel, pace } = req.query as unknown as {
        currentLevel: string;
        targetLevel: string;
        pace: string;
      };
      const result = await getStudyEstimate(currentLevel, targetLevel, pace);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;