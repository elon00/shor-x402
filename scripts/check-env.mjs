import fs from "node:fs";

const requiredIgnored = [".env*"];
if (!fs.existsSync(".gitignore")) {
  console.error("ENV CHECK FAIL: .gitignore is missing");
  process.exit(1);
}
const ignored = fs.readFileSync(".gitignore", "utf8");
for (const pattern of requiredIgnored) {
  if (!ignored.includes(pattern)) {
    console.error(`ENV CHECK FAIL: .gitignore is missing ${pattern}`);
    process.exit(1);
  }
}
console.log("ENV CHECK PASS: repository policy protects .env files.");
