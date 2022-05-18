const BRANCH = process.env.BRANCH_NAME;
const isMaster = BRANCH === "master" || BRANCH === "main";

module.exports = {
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "semantic-release-vsce",
      {
        packageVsix: true,
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          {
            path: "*.vsix",
            label: "Extension File",
          },
        ],
      },
    ],
    isMaster && "@semantic-release/git",
  ].filter(Boolean),
};
