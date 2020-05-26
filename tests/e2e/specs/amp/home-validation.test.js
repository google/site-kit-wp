/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	deactivatePlugin,
} from '@wordpress/e2e-test-utils';

/**
 * Internal depedencies
 */
import {
	activateAMPWithMode,
	deactivateUtilityPlugins,
	setupSiteKit,
} from '../../utils';

describe( 'AMP Homepage', () => {
	beforeAll( async () => {
		await setupSiteKit();
		await activatePlugin( 'e2e-tests-admin-bar-visibility' );
		await activateAMPWithMode( 'standard' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'amp' );
		await deactivateUtilityPlugins();
	} );

	describe( 'Logged-in user', () => {
		it( 'has no validation errors', async () => {
			await expect( '/' ).toHaveValidAMPForUser();
		} );
	} );
	describe( 'Non-logged-in user', () => {
		it( 'has no validation errors', async () => {
			await expect( '/' ).toHaveValidAMPForVisitor();
		} );
	} );
} );
