/**
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
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { createServer as createTLSServer } from 'node:https';
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function handler( req: IncomingMessage, res: ServerResponse ) {
	const host = req.headers.host || 'unknown';
	const method = req.method || 'GET';
	const url = req.url || '/';

	const contentType = { 'Content-Type': 'application/json' };

	const fixturesHeader = req.headers[ 'x-wp-test-fixtures' ];
	const fixtures = Array.isArray( fixturesHeader )
		? fixturesHeader[ 0 ]
		: fixturesHeader;

	global.console.log( '[%s] %s %s', host, method, url );

	let body = '';
	req.on( 'data', ( chunk: Buffer | string ) => ( body += chunk ) );
	req.on( 'end', () => {
		try {
			if ( ! fixtures ) {
				throw new Error( 'Missing x-wp-test-fixtures header' );
			}

			const path = join( __dirname, 'data', fixtures, host + '.json' );
			const data = JSON.parse( readFileSync( path, 'utf8' ) ) as Record<
				string,
				Record< string, { status: number; body: unknown } >
			>;

			let key = method;
			if ( body ) {
				key += '::' + body.toLowerCase();
			}

			const response = data[ key ]?.[ url ];
			if ( ! response ) {
				res.writeHead( 404, contentType );
				res.end( JSON.stringify( { error: 'Fixture not found' } ) );
				return;
			}

			res.writeHead( response.status, contentType );
			res.end( JSON.stringify( response.body ) );
		} catch ( err ) {
			global.console.error( 'Failed to process request:', err );

			res.writeHead( 500, contentType );
			res.end(
				JSON.stringify( {
					error: err instanceof Error ? err.message : String( err ),
				} )
			);
		}
	} );
}

function generateSelfSignedCert(): { key: string; cert: string } {
	const dir = mkdtempSync( join( tmpdir(), 'cert-' ) );
	const keyPath = join( dir, 'key.pem' );
	const certPath = join( dir, 'cert.pem' );

	execSync(
		`openssl req -x509 -newkey rsa:2048 -keyout ${ keyPath } -out ${ certPath } -days 365 -nodes -subj "/CN=googleapis.com" -addext "subjectAltName=DNS:*.googleapis.com,DNS:googleapis.com"`,
		{ stdio: 'pipe' }
	);

	return {
		key: readFileSync( keyPath, 'utf8' ),
		cert: readFileSync( certPath, 'utf8' ),
	};
}

function startServers() {
	const httpServer = createServer( handler );
	httpServer.listen( 80, () => {
		global.console.log( 'HTTP server running on port 80' );
	} );

	const { key, cert } = generateSelfSignedCert();
	const httpsServer = createTLSServer( { key, cert }, handler );
	httpsServer.listen( 443, () => {
		global.console.log( 'HTTPS server running on port 443' );
	} );
}

try {
	startServers();
} catch ( err ) {
	global.console.error(
		'Failed to start HTTPS server:',
		err instanceof Error ? err.message : String( err )
	);
	global.console.log( 'Continuing with HTTP only.' );
}
