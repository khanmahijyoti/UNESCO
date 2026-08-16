/* Loads web/.env into process.env, if it exists.
   Required at the top of every script that reads configuration, so a
   contributor sets things up once instead of exporting three variables
   into every shell. Real environment variables always win, which keeps
   CI and one-off overrides working:

     SUPABASE_URL=... npm run build     # beats whatever .env says
*/
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, ".env");
if (fs.existsSync(file)) {
  const before = { ...process.env };
  try {
    // Node >= 20.12
    process.loadEnvFile(file);
  } catch {
    // Older Node, or a parse failure: do it by hand.
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/i);
      if (!m) continue;
      const v = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      if (!(m[1] in process.env)) process.env[m[1]] = v;
    }
  }
  // loadEnvFile overwrites; restore anything that was already set so an
  // explicit variable on the command line still takes precedence.
  for (const k of Object.keys(before)) process.env[k] = before[k];
}
