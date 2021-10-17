module.exports = {
    branches: ['main', 'development'],
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
        '@semantic-release/github',
        //'@semantic-release/npm'
    ]
}