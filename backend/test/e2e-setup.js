const { execSync } = require("child_process");
const path = require("path");

module.exports = async () => {
  console.log("E2E setup: clearing DB & seeding data...");

  execSync(
    'npx ts-node --transpile-only -r tsconfig-paths/register src/seeding/seed-all.ts',
    {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    },
  );

  console.log("E2E setup complete.");
};