/**
 * Visual regression test constants.
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

const ROOT_DIR = path.resolve( __dirname, '../..' );

// The `VRT=1` Storybook build (`npm run build:storybook`).
const DIST_DIR = path.resolve( ROOT_DIR, process.env.VRT_DIST_DIR || 'dist' );

const PORT = Number( process.env.VRT_PORT || 3000 );

const SCREENSHOTS_DIR = path.resolve( __dirname, '__screenshots__' );

// Hosts the stories may load from. Chromium resolves every other host to
// nothing, so a story can't depend on a remote resource that changes or goes
// down. Google Sans and the Google Charts loader are the only exceptions.
const ALLOWED_HOSTS = [
	'localhost',
	'127.0.0.1',
	'fonts.googleapis.com',
	'fonts.gstatic.com',
	'www.gstatic.com',
];

// "Now" for every story that doesn't set its own reference date, so dates in
// screenshots don't change from one day to the next.
const FIXED_NOW = Date.parse( '2026-06-15T12:00:00.000Z' );

module.exports = {
	ALLOWED_HOSTS,
	DIST_DIR,
	FIXED_NOW,
	PORT,
	ROOT_DIR,
	SCREENSHOTS_DIR,
};
