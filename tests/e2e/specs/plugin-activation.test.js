/**
 * Plugin activation tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * WordPress dependencies
 */
import { deactivatePlugin, activatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { createWaitForFetchRequests } from '../utils';

function activateSiteKit() {
	return activatePlugin( 'google-site-kit' );
}

function deactivateSiteKit() {
	return deactivatePlugin( 'google-site-kit' );
}

describe( 'plugin activation notice', () => {
	// Ensure Site Kit is disabled before running each test as it's enabled by default.
	beforeEach( deactivateSiteKit );
	afterAll( activateSiteKit );

	const matrix = {
		shouldBeDisplayed: async () => {
			const waitForFetchRequests = createWaitForFetchRequests();
			await activateSiteKit();

			await page.waitForSelector( '.googlesitekit-activation__title' );

			await expect( page ).toMatchElement(
				'.googlesitekit-activation__title',
				{
					text: /Congratulations, the Site Kit plugin is now activated/i,
				}
			);

			await waitForFetchRequests(); // Wait for compatibility checks to finish.
		},
		shouldNotDisplayNoScriptNotice: async () => {
			const waitForFetchRequests = createWaitForFetchRequests();
			await activateSiteKit();

			await expect( page ).not.toMatchElement(
				'.googlesitekit-noscript'
			);

			await waitForFetchRequests(); // Wait for compatibility checks to finish.
		},
	};

	describe( 'using proxy auth', () => {
		beforeAll( async () => {
			await activatePlugin( 'e2e-tests-proxy-credentials-plugin' );
		} );

		afterAll( async () => {
			await deactivatePlugin( 'e2e-tests-proxy-credentials-plugin' );
		} );

		it( 'should be displayed', matrix.shouldBeDisplayed );

		it(
			'should not display noscript notice',
			matrix.shouldNotDisplayNoScriptNotice
		);
	} );

	describe( 'using GCP auth', () => {
		beforeAll( async () => {
			await activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		} );

		afterAll( async () => {
			await deactivatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		} );

		it( 'should be displayed', matrix.shouldBeDisplayed );

		it(
			'should not display noscript notice',
			matrix.shouldNotDisplayNoScriptNotice
		);

		it( 'should lead you to the setup wizard with GCP auth', async () => {
			const waitForFetchRequests = createWaitForFetchRequests();

			await activateSiteKit();

			await page.waitForSelector( '.googlesitekit-activation__title' );

			await expect( page ).toMatchElement( '.googlesitekit-start-setup', {
				text: 'Start setup',
			} );

			await waitForFetchRequests(); // Wait for compatibility checks to finish.

			await page.click( '.googlesitekit-start-setup' );
			await page.waitForSelector( '.googlesitekit-wizard-step__title' );

			// Ensure we're on the first step.
			await expect( page ).toMatchElement(
				'.googlesitekit-wizard-progress-step__number--inprogress',
				{ text: '1' }
			);
		} );
	} );
} );
