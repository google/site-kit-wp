/**
 * Internal dependencies
 */
import { switchUserToAdmin, switchUserToTest, visitAdminPage } from '@wordpress/e2e-test-utils';

const PLUGIN_SLUG = 'e2e-tests-reset-plugin';

/**
 * Reset Site Kit using utility plugin.
 */
export async function resetSiteKit() {
	await switchUserToAdmin();
	await visitAdminPage( 'plugins.php' );
	await page.click( `tr[data-slug="${ PLUGIN_SLUG }"] .activate a` );
	await page.waitForSelector( `tr[data-slug="${ PLUGIN_SLUG }"]` );
	await switchUserToTest();
}
