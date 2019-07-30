
import { switchUserToAdmin, visitAdminPage, switchUserToTest } from '@wordpress/e2e-test-utils';

/**
 * Deactivate all plugins except Site Kit.
 */
export async function deactivateAllOtherPlugins() {
	await switchUserToAdmin();
	await visitAdminPage( 'plugins.php' );

	// Select all plugins
	await page.click( '#cb-select-all-1' );

	// Uncheck Site Kit
	await page.click( 'input[type="checkbox"][value="google-site-kit/google-site-kit.php"]' );

	// Bulk deactivate
	await page.select( 'select#bulk-action-selector-bottom', 'deactivate-selected' );
	await page.click( '#doaction2' );
	await switchUserToTest();
}
