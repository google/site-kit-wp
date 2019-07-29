/**
 * Internal dependencies
 */
import { activatePlugin, deactivatePlugin } from '@wordpress/e2e-test-utils';

const PLUGIN_SLUG = 'e2e-tests-reset-plugin';

/**
 * Reset Site Kit using utility plugin.
 */
export async function resetSiteKit() {
	await activatePlugin( PLUGIN_SLUG );
	await deactivatePlugin( PLUGIN_SLUG );
}
