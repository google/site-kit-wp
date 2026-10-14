/**
 * Static server for the Storybook build used by the visual regression tests.
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
const fs = require( 'fs' );
const http = require( 'http' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { DIST_DIR, PORT } = require( './constants' );

const MIME_TYPES = {
	'.css': 'text/css',
	'.gif': 'image/gif',
	'.html': 'text/html',
	'.ico': 'image/x-icon',
	'.jpg': 'image/jpeg',
	'.js': 'application/javascript',
	'.json': 'application/json',
	'.map': 'application/json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.ttf': 'font/ttf',
	'.txt': 'text/plain',
	'.webp': 'image/webp',
	'.woff': 'font/woff',
	'.woff2': 'font/woff2',
};

// The build doesn't change during a run, so the browser can cache every file.
// Each capture is a fresh navigation, and a warm cache (including V8's code
// cache) is what keeps those cheap.
const CACHE_CONTROL = 'public, max-age=86400';

const server = http.createServer( ( request, response ) => {
	const { pathname } = new URL( request.url, 'http://localhost' );
	const filePath = path.join( DIST_DIR, decodeURIComponent( pathname ) );

	// Don't serve anything outside the build directory.
	if ( ! filePath.startsWith( DIST_DIR + path.sep ) ) {
		response.writeHead( 403 );
		response.end();
		return;
	}

	fs.readFile( filePath, ( error, contents ) => {
		if ( error ) {
			response.writeHead( 404 );
			response.end();
			return;
		}

		response.writeHead( 200, {
			'Cache-Control': CACHE_CONTROL,
			'Content-Type':
				MIME_TYPES[ path.extname( filePath ) ] ||
				'application/octet-stream',
		} );
		response.end( contents );
	} );
} );

server.listen( PORT, () => {
	// eslint-disable-next-line no-console
	console.log( `Serving ${ DIST_DIR } on http://localhost:${ PORT }` );
} );
