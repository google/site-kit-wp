
/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * The allow list of AMP modes.
 *
 */
export const allowedAmpModes = {
	standard: 'standard',
	transitional: 'transitional',
	reader: 'disabled',
};

/**
 * Activate AMP and set it to the correct mode.
 *
 * @param {string} mode The mode to set AMP to. Possible value of standard, transitional or reader.
 */
export const activateAmpAndSetMode = async ( mode ) => {
	await activatePlugin( 'amp' );
	await setAMPMode( mode );
};

/**
 * Set AMP Mode
 *
 * @param {string} mode The mode to set AMP to. Possible value of standard, transitional or reader.
 */
export const setAMPMode = async ( mode ) => {
	// Test to be sure that the passed mode is known.
	expect( Object.keys( allowedAmpModes ) ).toContain( mode );
	// Set the AMP mode
	await visitAdminPage( 'admin.php', 'page=amp-options' );
	await expect( page ).toClick( `#theme_support_${ allowedAmpModes[ mode ] }` );
	await expect( page ).toClick( '#submit' );
	await page.waitForSelector( '#setting-error-settings_updated' );
	await expect( page ).toMatchElement( '#setting-error-settings_updated', { text: 'Settings saved.' } );
};
