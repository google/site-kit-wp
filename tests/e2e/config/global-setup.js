/**
 * Global setup for parallel E2E tests.
 *
 * Runs once before all workers. Clears screenshots directory and
 * health-checks all WordPress instances.
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

const path = require( 'path' );
const { rm } = require( 'fs/promises' );
const http = require( 'http' );

const WORKERS = parseInt( process.env.E2E_PARALLEL_WORKERS, 10 ) || 4;
const BASE_PORT = 9002;
const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

function healthCheck( port ) {
	return new Promise( ( resolve ) => {
		const req = http.get( `http://localhost:${ port }`, ( res ) => {
			// Any response (even a redirect) means the server is up.
			res.resume();
			resolve( true );
		} );
		req.on( 'error', () => resolve( false ) );
		req.setTimeout( 5000, () => {
			req.destroy();
			resolve( false );
		} );
	} );
}

async function waitForWorker( workerIndex ) {
	const port = BASE_PORT + workerIndex;

	for ( let attempt = 1; attempt <= MAX_RETRIES; attempt++ ) {
		const isUp = await healthCheck( port );
		if ( isUp ) {
			process.stdout.write(
				`Worker ${ workerIndex }: WordPress is ready on port ${ port }.\n`
			);
			return;
		}

		await new Promise( ( resolve ) =>
			setTimeout( resolve, RETRY_DELAY_MS )
		);
	}

	throw new Error(
		`Worker ${ workerIndex }: WordPress on port ${ port } did not become ready after ${ MAX_RETRIES } retries.`
	);
}

module.exports = async function globalSetup( globalConfig ) {
	// Clear screenshots directory once before all workers.
	const screenshotsDir = path.resolve( __dirname, '..', 'screenshots' );
	await rm( screenshotsDir, { recursive: true, force: true } );

	// Health-check all WordPress instances.
	const checks = [];
	for ( let i = 0; i < WORKERS; i++ ) {
		checks.push( waitForWorker( i ) );
	}

	await Promise.all( checks );

	// Run jest-puppeteer's global setup to launch browser(s) and set
	// PUPPETEER_WS_ENDPOINTS, which the PuppeteerEnvironment needs to
	// connect workers to Chromium instances.
	const {
		setup: puppeteerGlobalSetup,
	} = require( 'jest-environment-puppeteer' );
	await puppeteerGlobalSetup( globalConfig );
};
