const nextCfg = require("eslint-config-next");
const base = Array.isArray(nextCfg)
  ? nextCfg
  : nextCfg && nextCfg.default
  ? nextCfg.default
  : [];

module.exports = [
  ...base,
  {
    ignores: ["node_modules", ".next", "dist", "build", ".turbo"],
  },
];
