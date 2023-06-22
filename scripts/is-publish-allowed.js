const currentGitBranch = require('current-git-branch');

const tag = process.env.npm_config_tag || 'latest';
if(tag === 'latest' && currentGitBranch() !== 'release') {
    console.error("Can only do prereleases from branches other than release");
    console.log("Use 'npm publish --tag <tag>' to create a prerelease.")
    process.exit(1);
};