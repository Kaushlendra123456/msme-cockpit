import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { computeReorderSuggestions } from "../services/reorder.service";
import { computeHealthScore } from "../services/healthscore.service";
import { getCashFlowForecast } from "../services/forecast.service";

export const getReorderSuggestions = async (req: Request, res: Response) => {
  const suggestions = await computeReorderSuggestions(req.user!.businessId);
  res.json(suggestions);
};

export const getHealthScore = async (req: Request, res: Response) => {
  const result = await computeHealthScore(req.user!.businessId);
  res.json(result);
};

export const getHealthScoreHistory = async (req: Request, res: Response) => {
  const history = await prisma.businessHealthScore.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: { computedAt: "desc" },
    take: 30,
  });
  res.json(history);
};

export const getCashFlowForecastHandler = async (req: Request, res: Response) => {
  const horizon = Number(req.query.horizon) || 30;
  const forecast = await getCashFlowForecast(req.user!.businessId, horizon);
  res.json(forecast);
};
