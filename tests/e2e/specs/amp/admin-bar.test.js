/**
 * AMP admin bar tests.
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
import { deactivatePlugin, activatePlugin, createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	activateAMPWithMode,
	deactivateUtilityPlugins,
	setupSiteKit,
	useRequestInterception,
} from '../../utils';
import * as adminBarMockResponses from '../modules/analytics/fixtures/admin-bar';

let mockBatchResponse;

describe( 'AMP Admin Bar compatibility', () => {
	beforeAll( async () => {
		await setupSiteKit();
		await activatePlugin( 'e2e-tests-admin-bar-visibility' );
		await activateAMPWithMode( 'primary' );

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'google-site-kit/v1/data/' ) ) {
				request.respond( {
					status: 200,
					body: JSON.stringify( mockBatchResponse ),
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		mockBatchResponse = [];
		await page.goto( createURL( '/hello-world' ), { waitUntil: 'load' } );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'amp' );
		await deactivateUtilityPlugins();
	} );

	it( 'it has a functional Site Kit admin bar in AMP', async () => {
		const { searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = searchConsole;

		await expect( page ).toHaveValidAMPForUser();
		await expect( page ).toHaveValidAMPForVisitor();

		await Promise.all( [
			page.hover( '#wp-admin-bar-google-site-kit' ),
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
		] );

		const adminBarApp = await page.$( '#js-googlesitekit-adminbar' );
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-data-block__title', { text: /total clicks/i } );
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-data-block__title', { text: /total impressions/i } );
		// Ensure Analytics CTA is displayed
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-cta-link', { text: /Set up analytics/i } );
		// More details link
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-cta-link', { text: /More details/i } );
		await adminBarApp.dispose();
	} );
} );
