import * as dotenv from "dotenv";

let loaded = false;

export function LoadEnv(): void {
  if (loaded) return;
  dotenv.config();
  loaded = true;
}
