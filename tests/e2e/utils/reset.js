/**
 * Internal dependencies
 */
/**
 * WordPress dependencies
 */
import { clearLocalStorage } from '@wordpress/e2e-test-utils';
import { clearSessionStorage } from './clear-session-storage';
import { visitAdminPage } from '@wordpress/e2e-test-utils/build/visit-admin-page';
import { wpApiFetch } from './wp-api-fetch';

/**
 * Reset Site Kit using utility plugin.
 */
export async function resetSiteKit() {
	if ( ! page.url().includes( '/wp-admin' ) ) {
		await visitAdminPage( '/' );
	}

	await Promise.all( [
		wpApiFetch( {
			path: 'google-site-kit/v1/core/site/data/reset',
			method: 'post',
		} ),
		clearLocalStorage(),
		clearSessionStorage(),
		page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/core/site/data/reset' ) ),
	] );

	// Prevent "Cannot log after tests are done." errors.
	if ( '1' === process.env.DEBUG_REST ) {
		await page.waitFor( 250 );
	}
}
