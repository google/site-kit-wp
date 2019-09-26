/**
 * WordPress dependencies
 */
import { activatePlugin, createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setupAnalytics,
	setSiteVerification,
	setSearchConsoleProperty,
	useRequestInterception,
} from '../../../utils';
import * as adminBarMockResponses from './fixtures/admin-bar';

let mockBatchResponse;

describe( 'Site Kit admin bar component display', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await activatePlugin( 'e2e-tests-admin-bar-visibility' );
		await setSiteVerification();
		await setSearchConsoleProperty();

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

		await page.goto( createURL( '/hello-world' ), { waitUntil: 'domcontentloaded' } );
	} );

	it( 'loads Analytics data when the module is active', async () => {
		const { analytics, searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = Object.assign( {}, analytics, searchConsole );

		await setupAnalytics();
		await page.reload();

		await Promise.all( [
			page.hover( '#wp-admin-bar-google-site-kit' ),
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
		] );

		const adminBarApp = await page.$( '#js-googlesitekit-adminbar' );
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-data-block__title', { text: /total clicks/i } );
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-data-block__title', { text: /total impressions/i } );
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-data-block__title', { text: /total users/i } );
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-data-block__title', { text: /total sessions/i } );
		await adminBarApp.dispose();
	} );
} );
