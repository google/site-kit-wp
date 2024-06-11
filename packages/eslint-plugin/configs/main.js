/**
 * ESLint plugin config.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
	rules: {
		'sitekit/acronym-case': [ 'error' ],
		'sitekit/jsdoc-third-person': [ 'error' ],
		'sitekit/jsdoc-fullstop': [ 'error' ],
		'sitekit/jsdoc-newlines': [ 'error' ],
		'sitekit/jsdoc-requires-since': [ 'error' ],
		'sitekit/jsdoc-capitalization': [ 'error' ],
		'sitekit/jsdoc-tag-grouping': [ 'error' ],
		'sitekit/jsdoc-tag-order': [ 'error' ],
		'sitekit/no-yield-dispatch': [ 'error' ],
		'sitekit/no-direct-date': [
			'error',
			{ ignoreFiles: [ '*/webpack/*', '*.stories.js', '*.test.js' ] },
		],
	},
};
