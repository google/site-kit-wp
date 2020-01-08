/**
 * Internal dependencies
 */
/**
 * WordPress dependencies
 */
import { activatePlugin, deactivatePlugin, clearLocalStorage } from '@wordpress/e2e-test-utils';
import { clearSessionStorage } from './clear-session-storage';

const PLUGIN_SLUG = 'e2e-tests-reset-plugin';

/**
 * Reset Site Kit using utility plugin.
 */
export async function resetSiteKit() {
	await activatePlugin( PLUGIN_SLUG );
	await clearLocalStorage();
	await clearSessionStorage();
	await deactivatePlugin( PLUGIN_SLUG );
}
