import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

// .env лежит в корне монорепо, а не в packages/miniapp — Next.js по
// умолчанию его не подхватывает, поэтому грузим явно перед сборкой/дев-сервером.
const dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(dirname, "../../.env") });

/** @type {import('next').NextConfig} */
const nextConfig = {
  // @finance-bot/bot и @finance-bot/db — воркспейс-пакеты, публикующие
  // скомпилированный dist; transpilePackages подстраховывает на случай,
  // если Next встретит в них ещё не собранный TS.
  transpilePackages: ["@finance-bot/bot", "@finance-bot/db"],
};

export default nextConfig;
