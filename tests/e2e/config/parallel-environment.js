/**
 * Parallel E2E test environment.
 *
 * Custom Jest environment that assigns each worker its own WordPress instance
 * by computing the port and compose project name from JEST_WORKER_ID.
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

const PuppeteerEnvironment = require( 'jest-environment-puppeteer' );

class ParallelEnvironment extends PuppeteerEnvironment {
	constructor( config, context ) {
		// JEST_WORKER_ID is 1-based.
		const workerID = parseInt( process.env.JEST_WORKER_ID, 10 ) || 1;
		const workerIndex = workerID - 1;
		const workerPort = 9002 + workerIndex;

		// Set env vars before the parent constructor and setup run,
		// so that @wordpress/e2e-test-utils and other setup files
		// pick up the correct URL and compose project.
		process.env.WP_BASE_URL = `http://localhost:${ workerPort }`;
		process.env.E2E_COMPOSE_PROJECT = `googlesitekit-e2e-w${ workerIndex }`;

		super( config, context );
	}
}

module.exports = ParallelEnvironment;
