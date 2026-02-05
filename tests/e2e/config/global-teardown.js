/**
 * Global teardown for parallel E2E tests.
 *
 * Runs once after all workers complete. Stub for any post-parallel cleanup.
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

module.exports = async function globalTeardown( globalConfig ) {
	// Run jest-puppeteer's global teardown to close browser(s) that were
	// launched during global setup.
	const {
		teardown: puppeteerGlobalTeardown,
	} = require( 'jest-environment-puppeteer' );
	await puppeteerGlobalTeardown( globalConfig );
};
