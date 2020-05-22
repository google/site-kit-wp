/**
 * WordPress dependencies
 */
import { deactivatePlugin, activatePlugin, createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal depedencies
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
		await activateAMPWithMode( 'standard' );

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

	it( 'Site Kit admin bar component display', async () => {
		const { searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = searchConsole;

		await expect( page ).toHaveValidAMP( { loggedIn: true } );

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
