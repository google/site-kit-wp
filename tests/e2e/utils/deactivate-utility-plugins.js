/**
 * WordPress dependencies
 */
import {
	switchUserToAdmin,
	visitAdminPage,
	switchUserToTest,
	isCurrentURL,
} from '@wordpress/e2e-test-utils';

/**
 * Deactivates all Site Kit utility plugins.
 */
export async function deactivateUtilityPlugins() {
	// Avoid interrupting active network requests.
	await page.waitForNetworkIdle();
	await switchUserToAdmin();

	if ( ! isCurrentURL( 'wp-admin/plugins.php' ) ) {
		await visitAdminPage( 'plugins.php' );
	}

	await page.waitForSelector( '#wpfooter' );

	const activeUtilities = await page.$$eval(
		'.active[data-plugin^="google-site-kit-test-plugins/"]',
		( rows ) => {
			return rows.map( ( row ) => row.dataset.plugin );
		}
	);

	// Bail if there are no plugins to deactivate
	if ( ! activeUtilities.length ) {
		return;
	}

	// Check the boxes of plugins to deactivate.
	await page.$$eval(
		'.active[data-plugin^="google-site-kit-test-plugins/"] input[type="checkbox"]',
		( checkboxes ) => {
			checkboxes.forEach( ( checkbox ) => ( checkbox.checked = true ) );
		}
	);

	// Bulk deactivate
	await page.select(
		'select#bulk-action-selector-bottom',
		'deactivate-selected'
	);
	await Promise.all( [
		page.click( '#doaction2' ),
		page.waitForNavigation(),
	] );
	await switchUserToTest();
}
