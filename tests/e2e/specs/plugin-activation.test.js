/**
 * Plugin activation tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useRequestInterception } from '../utils';

describe( 'Plugin Activation Notice', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( '/google-site-kit/v1/data/' ) ) {
				request.respond( { status: 200 } );
			} else {
				request.continue();
			}
		} );
	} );
	describe( 'When Javascript is enabled', () => {
		// Ensure Site Kit is disabled before running each test as it's enabled by default.
		beforeEach( async () => {
			await deactivatePlugin( 'google-site-kit' );
		} );

		afterEach( async () => {
			await activatePlugin( 'google-site-kit' );
		} );

		describe( 'using Proxy auth', () => {
			beforeEach( async () => {
				await activatePlugin( 'e2e-tests-proxy-credentials-plugin' );
			} );
			afterEach( async () => {
				await deactivatePlugin( 'e2e-tests-proxy-credentials-plugin' );
			} );
			it( 'Should be displayed', async () => {
				await activatePlugin( 'google-site-kit' );
				await page.waitForSelector( '.googlesitekit-activation__title' );
				await expect( page ).toMatchElement( '.googlesitekit-activation__title', { text: /Congratulations, the Site Kit plugin is now activated./i } );
			} );
			it( 'Should not display noscript notice', async () => {
				await activatePlugin( 'google-site-kit' );

				await expect( page ).not.toMatchElement( '.googlesitekit-noscript' );

				await deactivatePlugin( 'google-site-kit' );
			} );
		} );
		describe( 'using GCP auth', () => {
			beforeEach( async () => {
				await activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
			} );
			afterEach( async () => {
				await deactivatePlugin( 'e2e-tests-gcp-credentials-plugin' );
			} );
			it( 'Should lead you to the setup wizard with GCP auth', async () => {
				await activatePlugin( 'google-site-kit' );

				await page.waitForSelector( '.googlesitekit-activation' );

				await expect( page ).toMatchElement( '.googlesitekit-start-setup', { text: 'Start setup' } );

				await page.click( '.googlesitekit-start-setup' );
				await page.waitForSelector( '.googlesitekit-setup__title' );

				// Ensure we're on the set up page.
				await expect( page ).toMatchElement( '.googlesitekit-setup__title', { text: 'Set up Site Kit' } );

				await deactivatePlugin( 'google-site-kit' );
			} );
		} );
	} );

	describe( 'When Javascript is disabled', () => {
		beforeEach( async () => {
			await deactivatePlugin( 'google-site-kit' );
		} );

		afterEach( async () => {
			await activatePlugin( 'google-site-kit' );
		} );

		it( 'Should not display plugin html', async () => {
			// Disabling JavaScript in `beforeEach` breaks utility functions.
			// Each test without JavaScript must use
			// `await page.setJavaScriptEnabled( false );` and
			// `await page.setJavaScriptEnabled( true );` in the test itself.
			await page.setJavaScriptEnabled( false );
			await activatePlugin( 'google-site-kit' );

			await expect( page ).toMatchElement( '[id^=js-googlesitekit-]', { visible: false } );
			await expect( page ).not.toMatchElement( '.googlesitekit-activation__title' );

			await deactivatePlugin( 'google-site-kit' );
			await page.setJavaScriptEnabled( true );
		} );

		it( 'Should display noscript notice', async () => {
			await page.setJavaScriptEnabled( false );
			await activatePlugin( 'google-site-kit' );

			await expect( page ).toMatchElement(
				'.googlesitekit-noscript__text',
				{ text: /The Site Kit by Google plugin requires JavaScript to be enabled in your browser./i },
				{ visible: true }
			);

			await deactivatePlugin( 'google-site-kit' );
			await page.setJavaScriptEnabled( true );
		} );
	} );
} );
