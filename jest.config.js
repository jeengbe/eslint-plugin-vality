// @ts-check

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  coverageReporters: ["lcov", "json-summary", "text-summary"],
  verbose: false,
  transform: {
    "^.+\\.ts?$": "@swc/jest",
  }
};
