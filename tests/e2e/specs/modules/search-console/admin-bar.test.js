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
	wpApiFetch,
} from '../../../utils';
import * as adminBarMockResponses from './fixtures/admin-bar';

let mockBatchResponse;

describe( 'admin bar display on the front end and in the post editor', () => {
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

	afterEach( async () => {
		mockBatchResponse = [];
		// Deactivate Analytics
		await wpApiFetch( {
			method: 'post',
			path: 'google-site-kit/v1/modules/analytics',
			data: { active: false },
		} );
	} );

	it( 'loads the Site Kit admin bar component when viewing the front and back end of a post with data in Search Console (no Analytics)', async () => {
		const { searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = searchConsole;

		// Ensure mouseover listener is registered (load)
		await page.goto( createURL( '/hello-world/' ), { waitUntil: 'domcontentloaded' } );
		await Promise.all( [
			page.hover( '#wp-admin-bar-google-site-kit' ),
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
		] );

		// const adminBarAppFront = await page.$( '#js-googlesitekit-adminbar' );
		await expect( page ).toMatchElement( '#js-googlesitekit-adminbar .googlesitekit-data-block__title', { text: /total clicks/i } );
		await expect( page ).toMatchElement( '#js-googlesitekit-adminbar .googlesitekit-data-block__title', { text: /total impressions/i } );
		// Ensure Analytics CTA is displayed
		await expect( page ).toMatchElement( '#js-googlesitekit-adminbar .googlesitekit-cta-link', { text: /Set up analytics/i } );
		// More details link
		await expect( page ).toMatchElement( '#js-googlesitekit-adminbar .googlesitekit-cta-link', { text: /More details/i } );
	} );

	it( 'the Site Kit admin bar component also loads Analytics data when the module is active', async () => {
		const { analytics, searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = Object.assign( {}, analytics, searchConsole );

		await setupAnalytics();

		// Ensure mouseover listener is registered (load)
		await page.goto( createURL( '/hello-world/' ), { waitUntil: 'domcontentloaded' } );
		await Promise.all( [
			page.hover( '#wp-admin-bar-google-site-kit' ),
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
		] );

		await expect( page ).toMatchElement( '#js-googlesitekit-adminbar .googlesitekit-data-block__title', { text: /total clicks/i } );
		await expect( page ).toMatchElement( '#js-googlesitekit-adminbar .googlesitekit-data-block__title', { text: /total impressions/i } );
		await expect( page ).toMatchElement( '#js-googlesitekit-adminbar .googlesitekit-data-block__title', { text: /total users/i } );
		await expect( page ).toMatchElement( '#js-googlesitekit-adminbar .googlesitekit-data-block__title', { text: /total sessions/i } );
	} );
} );
