/**
 * WordPress dependencies
 */
import { activatePlugin, createURL } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
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

	it( 'loads when viewing the front end of a post with data in Search Console', async () => {
		const { searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = searchConsole;

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

	it( 'loads when editing a post with data in Search Console', async () => {
		const { searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = searchConsole;

		// Navigate to edit view for this post
		await Promise.all( [
			expect( page ).toClick( '#wp-admin-bar-edit a', { text: /edit post/i } ),
			page.waitForNavigation( { waitUntil: 'domcontentloaded' } ),
		] );

		// We're now in Gutenberg.

		await Promise.all( [
			page.hover( '#wp-admin-bar-google-site-kit' ),
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
		] );

		await page.evaluate( () => {
			// Temporarily replace XMLHttpRequest.send with a no-op to prevent a DOMException on navigation.
			// https://github.com/WordPress/gutenberg/blob/d635ca96f8c5dbdc993f30b1f3a3a0b4359e3e2e/packages/editor/src/components/post-locked-modal/index.js#L114
			window.XMLHttpRequest.prototype.send = function() {};
		} );

		const adminBarApp = await page.$( '#js-googlesitekit-adminbar' );
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-data-block__title', { text: /total clicks/i } );
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-data-block__title', { text: /total impressions/i } );
		// Ensure Analytics CTA is displayed
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-cta-link', { text: /Set up analytics/i } );
		// More details link
		await expect( adminBarApp ).toMatchElement( '.googlesitekit-cta-link', { text: /More details/i } );
		await adminBarApp.dispose();
	} );

	it( 'links "More details" to the dashboard details view for the current post', async () => {
		const { searchConsole } = adminBarMockResponses;
		// Data is requested when the Admin Bar app loads on first hover
		mockBatchResponse = searchConsole;

		await Promise.all( [
			page.hover( '#wp-admin-bar-google-site-kit' ),
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/data/' ) ),
			page.waitForSelector( '#js-googlesitekit-adminbar .googlesitekit-cta-link' ),
		] );

		// Follow more details
		await Promise.all( [
			expect( page ).toClick( '#js-googlesitekit-adminbar .googlesitekit-cta-link', { text: /More details/i } ),
			// Waiting for navigation here does not work as expected as this is a JS navigation.
			page.waitForSelector( '.googlesitekit-page-header__title' ),
		] );

		await expect( page ).toMatchElement( '.googlesitekit-page-header__title', { title: /Detailed Page Stats/i } );
	} );
} );
