// Общая точка правды по курсам валют — в packages/db, переиспользуется и
// Mini App'ом (packages/miniapp/app/api/summary/route.ts и т.д.).
export { getRate, convert } from "@finance-bot/db";
