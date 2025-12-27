/**
 * Maps common file extensions to programming languages.
 */
const EXTENSION_MAP = {
  // Web
  js: "JavaScript",
  ts: "TypeScript",
  jsx: "React JS",
  tsx: "React TS",
  html: "HTML",
  css: "CSS",
  scss: "Sass",
  sass: "Sass",
  less: "Less",
  json: "JSON",

  // Backend / General
  py: "Python",
  go: "Go",
  rs: "Rust",
  java: "Java",
  cs: "C#",
  cpp: "C++",
  c: "C",
  h: "C/C++",
  rb: "Ruby",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin",
  dart: "Dart",
  sh: "Shell",
  sql: "SQL",

  // Data / Config
  md: "Markdown",
  yaml: "YAML",
  yml: "YAML",
  xml: "XML",
  toml: "TOML",
  env: "Config",
  prisma: "Prisma",
  graphql: "GraphQL",
  gql: "GraphQL",
  proto: "Protobuf",
  sol: "Solidity",
};

/**
 * Detects the language of a file based on its extension.
 * @param {string} filePath - The path to the file.
 * @returns {string} - The detected language name or 'Other'.
 */
export const detectLanguage = (filePath) => {
  if (!filePath) return "Other";

  const fileName = filePath.split("/").pop().toLowerCase();

  // Filename specific checks
  if (fileName === "dockerfile") return "Docker";
  if (fileName.startsWith("docker-compose")) return "Docker";
  if (fileName === "package.json") return "NPM";
  if (fileName === "tsconfig.json") return "TypeScript Config";
  if (fileName === "next.config.js") return "Next.js";
  if (fileName === "vercel.json") return "Vercel";

  const parts = fileName.split(".");
  if (parts.length < 2) return "Other";

  const ext = parts.pop();
  return EXTENSION_MAP[ext] || "Other";
};

/**
 * Detects languages from a list of file paths and returns an object with counts.
 * @param {string[]} files - Array of file paths.
 * @returns {Object} - Object mapping language names to counts.
 */
export const getLanguagesFromFiles = (files) => {
  const counts = {};

  if (!files || !Array.isArray(files)) return counts;

  files.forEach((file) => {
    const lang = detectLanguage(file);
    counts[lang] = (counts[lang] || 0) + 1;
  });

  return counts;
};
