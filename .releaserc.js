/* 
 * Algodex Service 
 * Copyright (C) 2022 Algodex VASP (BVI) Corp.
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
