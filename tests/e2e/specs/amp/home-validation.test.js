/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	deactivatePlugin,
	createURL,
} from '@wordpress/e2e-test-utils';

/**
 * Internal depedencies
 */
import {
	activateAmpAndSetMode,
	deactivateUtilityPlugins,
	setupSiteKit,
} from '../../utils';

describe( 'AMP Homepage', () => {
	beforeAll( async () => {
		await setupSiteKit();
		await activatePlugin( 'e2e-tests-admin-bar-visibility' );
		await activateAmpAndSetMode( 'standard' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'amp' );
		await deactivateUtilityPlugins();
	} );

	describe( 'Logged in user.', () => {
		it( 'has no validation errors', async () => {
			await Promise.all( [
				page.goto( createURL( '/' ), { waitUntil: 'load' } ),
				page.waitForSelector( '#amp-admin-bar-item-status-icon' ),
			] );
			await expect( page ).toMatchElement( '#amp-admin-bar-item-status-icon', { text: '✅' } );
		} );
	} );
	describe( 'Non-logged-in user', () => {
		it( 'has no validation errors', async () => {
			await expect( '/' ).toHaveValidAMP();
		} );
	} );
} );
