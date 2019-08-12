
import { switchUserToAdmin, visitAdminPage, switchUserToTest, isCurrentURL } from '@wordpress/e2e-test-utils';

/**
 * Deactivate all plugins except Site Kit.
 */
export async function deactivateAllOtherPlugins() {
	await switchUserToAdmin();

	if ( ! isCurrentURL( 'wp-admin/plugins.php' ) ) {
		await visitAdminPage( 'plugins.php' );
	}

	await page.waitForSelector( 'input[type="checkbox"][value="google-site-kit/google-site-kit.php"]' );
	const activePlugins = await page.$$eval( '.active[data-plugin]', ( rows ) => {
		return rows.map( row => row.dataset.plugin );
	} );

	// Bail if there are no plugins to deactivate
	if ( 1 === activePlugins.length && 'google-site-kit/google-site-kit.php' === activePlugins[0] ) {
		return;
	}

	// Select all plugins
	await page.click( '#cb-select-all-1' );

	// Uncheck Site Kit
	await page.click( 'input[type="checkbox"][value="google-site-kit/google-site-kit.php"]' );

	// Bulk deactivate
	await page.select( 'select#bulk-action-selector-bottom', 'deactivate-selected' );
	await Promise.all( [
		page.click( '#doaction2' ),
		page.waitForNavigation(),
	] );
	await switchUserToTest();
}
