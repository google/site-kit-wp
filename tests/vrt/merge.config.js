/**
 * Playwright config for merging the reports of CI's shards.
 *
 * Used as `npx playwright merge-reports --config merge.config.js <blob reports>`.
 * Don't add `--reporter` or set `PLAYWRIGHT_HTML_OUTPUT_DIR`: both override
 * the reporters and folders configured here.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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

/**
 * External dependencies
 */
const path = require( 'path' );

module.exports = {
	testDir: __dirname,
	reporter: [
		// Listed before `html`: it empties `report/` when the merge starts.
		[ './reporter.js', { outputDir: 'report' } ],
		[
			'html',
			{
				open: 'never',
				outputFolder: path.join( __dirname, 'report', 'playwright' ),
			},
		],
	],
};
