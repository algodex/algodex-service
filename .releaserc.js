module.exports = {
    branches: ['main'],
    plugins: [
        [
            'semantic-release-gitmoji',
            {
            releaseRules: {
                major: [ ':boom:', '💥' ],
                minor: [ ':sparkles:', '✨' ],
                patch: [
                    ':bug:',
                    ':ambulance:',
                    ':lock:',
                    '🐛',
                    '🚑',
                    '🔒'
                ]
            },
            releaseNotes: {
                issueResolution: {
                    template: '{baseUrl}/{owner}/{repo}/issues/{ref}',
                    baseUrl: 'https://github.com',
                    source: 'github.com'
                }
            }
        }
        ],
        '@semantic-release/npm',
        ["@semantic-release/git", {
            "assets": ["package.json"],
            "message": "🔖 [skip ci] ${nextRelease.version} \n\n${nextRelease.notes}"
        }],
        '@semantic-release/github',

    ]
}
