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

type FixtureData = Record<
	string,
	Record< string, { status: number; body: unknown } >
>;

interface BatchPart {
	contentID: string;
	method: string;
	url: string;
	body: string;
}

function parseBatchParts( rawBody: string, boundary: string ): BatchPart[] {
	const parts: BatchPart[] = [];
	const delimiter = '--' + boundary;

	for ( const section of rawBody.split( delimiter ) ) {
		const trimmed = section.replace( /^[\r\n]+|[\r\n-]+$/g, '' );
		if ( ! trimmed ) {
			continue;
		}

		// Split outer MIME headers from the embedded HTTP request.
		const blankLine = trimmed.match( /\r?\n\r?\n/ );
		if ( ! blankLine || blankLine.index === undefined ) {
			continue;
		}

		const outerHeaders = trimmed.slice( 0, blankLine.index );
		const innerRequest = trimmed
			.slice( blankLine.index + blankLine[ 0 ].length )
			.trim();

		const contentIDMatch = outerHeaders.match( /^Content-ID:\s*(.+)$/im );
		if ( ! contentIDMatch ) {
			continue;
		}
		const contentID = contentIDMatch[ 1 ].trim();

		// Parse the embedded HTTP request line.
		const innerLines = innerRequest.split( /\r?\n/ );
		const requestMatch = innerLines[ 0 ].match( /^(\w+)\s+(\S+)\s+HTTP/i );
		if ( ! requestMatch ) {
			continue;
		}

		const method = requestMatch[ 1 ];
		const url = requestMatch[ 2 ];

		// The body follows the blank line inside the inner request.
		let innerBody = '';
		let blankFound = false;
		for ( let index = 1; index < innerLines.length; index++ ) {
			if ( ! blankFound ) {
				if ( innerLines[ index ].trim() === '' ) {
					blankFound = true;
				}
				continue;
			}
			innerBody += ( innerBody ? '\n' : '' ) + innerLines[ index ];
		}

		parts.push( { contentID, method, url, body: innerBody.trim() } );
	}

	return parts;
}

function handleBatchRequest(
	body: string,
	host: string,
	reqContentType: string,
	data: FixtureData,
	res: ServerResponse
): void {
	const boundaryMatch = reqContentType.match( /boundary=(\S+)/i );
	if ( ! boundaryMatch ) {
		res.writeHead( 400, { 'Content-Type': 'application/json' } );
		res.end(
			JSON.stringify( { error: 'Missing boundary in Content-Type' } )
		);
		return;
	}

	const boundary = boundaryMatch[ 1 ];
	const parts = parseBatchParts( body, boundary );
	const responseBoundary = 'batch_' + Date.now(); // eslint-disable-line sitekit/no-direct-date
	const responseParts: string[] = [];

	for ( const part of parts ) {
		const fixture = lookupFixture(
			data,
			host,
			part.method,
			part.url,
			part.body
		);
		const status = fixture ? fixture.status : 404;
		const statusText = status === 200 ? 'OK' : 'Not Found';
		const responseBody = fixture
			? JSON.stringify( fixture.body )
			: JSON.stringify( { error: 'Fixture not found' } );

		responseParts.push(
			`--${ responseBoundary }\r\n` +
				'Content-Type: application/http\r\n' +
				`Content-ID: response-${ part.contentID }\r\n` +
				'\r\n' +
				`HTTP/1.1 ${ status } ${ statusText }\r\n` +
				'Content-Type: application/json\r\n' +
				'\r\n' +
				responseBody
		);
	}

	const responseBody =
		responseParts.join( '\r\n' ) + `\r\n--${ responseBoundary }--`;

	res.writeHead( 200, {
		'Content-Type': `multipart/mixed; boundary=${ responseBoundary }`,
	} );
	res.end( responseBody );
}

function lookupFixture(
	data: FixtureData,
	host: string,
	method: string,
	url: string,
	body: string
): { status: number; body: unknown } | undefined {
	global.console.log( '[%s] %s %s', host, method, url );

	let key = method;
	if ( body ) {
		key += '::' + body.toLowerCase();
	}

	const response = data[ url ]?.[ key ];
	if ( ! response ) {
		global.console.log( 'Missing fixture for:\n    %s', body );
	}

	return response;
}

function handler( req: IncomingMessage, res: ServerResponse ) {
	const host = req.headers.host || 'unknown';
	const method = req.method || 'GET';
	const url = req.url || '/';

	const jsonContentType = { 'Content-Type': 'application/json' };

	const fixturesHeader = req.headers[ 'x-wp-test-fixtures' ];
	const fixtures = Array.isArray( fixturesHeader )
		? fixturesHeader[ 0 ]
		: fixturesHeader;

	// If no fixtures are specified, return an empty response.
	if ( ! fixtures ) {
		res.writeHead( 200, jsonContentType );
		res.end( '{}' );
		return;
	}

	let body = '';
	req.on( 'data', ( chunk: Buffer | string ) => ( body += chunk ) );
	req.on( 'end', () => {
		try {
			const dataPath = join( '/fixtures/data', fixtures, host + '.json' );
			const data = JSON.parse(
				readFileSync( dataPath, 'utf8' )
			) as FixtureData;

			if ( url === '/batch' ) {
				const reqContentType = req.headers[ 'content-type' ] || '';
				handleBatchRequest( body, host, reqContentType, data, res );
				return;
			}

			const response = lookupFixture( data, host, method, url, body );
			if ( ! response ) {
				res.writeHead( 404, jsonContentType );
				res.end( JSON.stringify( { error: 'Fixture not found' } ) );
				return;
			}

			res.writeHead( response.status, jsonContentType );
			res.end( JSON.stringify( response.body ) );
		} catch ( err ) {
			global.console.error( 'Failed to process request:', err );

			res.writeHead( 500, jsonContentType );
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
	const msg = err instanceof Error ? err.message : String( err );
	global.console.error( 'Failed to start HTTPS server:', msg );
}
