/**
 * Storybook story globs.
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

const rootDir = path.resolve( __dirname, '..' );

// Kept free of webpack and Storybook imports so the visual regression test
// runner (`tests/vrt/scenarios.js`) can read the globs without loading them.
module.exports = [
	path.resolve( rootDir, 'assets/js/**/*.stories.js' ),
	path.resolve( rootDir, 'assets/blocks/**/*.stories.js' ),
	path.resolve( rootDir, 'assets/js/**/*.stories.tsx' ),
	path.resolve( rootDir, 'assets/blocks/**/*.stories.tsx' ),
];
