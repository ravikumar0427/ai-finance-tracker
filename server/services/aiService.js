import OpenAI from 'openai';
import { analyzeFinance } from './financeAnalyzer.js';

// 15-minute in-memory cache
const insightsCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

const getCacheKey = (userId, transactions) => {
  const latestTx = transactions?.[0]?.transactionDate || 'none';
  return `${userId || 'anon'}_${transactions?.length || 0}_${latestTx}`;
};

const hasOpenAIKey = () => {
  const key = process.env.OPENAI_API_KEY;
  return key && key.startsWith('sk-') && key !== 'your_openai_api_key_here';
};

export const generateAIInsights = async ({ transactions, budget, userId }) => {
  const analysis = analyzeFinance({ transactions, budget });
  const cacheKey = getCacheKey(userId, transactions);

  const cached = insightsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  if (!hasOpenAIKey()) {
    const result = {
      provider: 'heuristic',
      insights: [...analysis.insights, ...analysis.recommendations].slice(0, 8),
      cached: false
    };
    insightsCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = [
      'Generate 4 to 6 concise, actionable personal finance insights for this user based on their data.',
      'Return ONLY a valid JSON array of strings, with no markdown formatting or backticks.',
      JSON.stringify({
        totalIncome: analysis.totalIncome,
        totalExpense: analysis.totalExpense,
        savings: analysis.savings,
        budgetRemaining: analysis.budgetRemaining,
        categoryBreakdown: analysis.categoryBreakdown,
        monthlyTrend: analysis.monthlyTrend
      })
    ].join('\n');

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 400
    });

    let raw = response.choices?.[0]?.message?.content?.trim() || '[]';
    if (raw.startsWith('```json')) raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    if (raw.startsWith('```')) raw = raw.replace(/```/g, '').trim();

    const insights = JSON.parse(raw);

    const result = {
      provider: 'openai',
      insights: Array.isArray(insights) && insights.length ? insights : analysis.insights,
      cached: false
    };
    insightsCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  } catch (error) {
    const result = {
      provider: 'heuristic',
      insights: [...analysis.insights, ...analysis.recommendations].slice(0, 8),
      cached: false
    };
    insightsCache.set(cacheKey, { timestamp: Date.now(), data: result });
    return result;
  }
};

export const predictExpense = async ({ transactions, budget, userId }) => {
  const analysis = analyzeFinance({ transactions, budget });

  return {
    predictedExpense: analysis.predictedExpense,
    confidence: analysis.confidence,
    budgetRisk: analysis.monthlyBudget > 0 ? analysis.predictedExpense > analysis.monthlyBudget : false,
    recommendations: analysis.recommendations
  };
};