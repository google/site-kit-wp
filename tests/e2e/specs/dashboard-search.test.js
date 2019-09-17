/**
 * WordPress dependencies
 */
import { activatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { setSiteVerification, setSearchConsoleProperty } from '../utils';
import { visitAdminPage } from '@wordpress/e2e-test-utils/build/visit-admin-page';

describe( 'Site Kit dashboard post search', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
	} );

	it( 'displays results when searching with a post title, and loads the details page when clicking View Data', async () => {
		const postSearcher = await page.$( '.googlesitekit-post-searcher' );

		await expect( postSearcher ).toFill( 'input', 'hello' );

		// Ensure expected options appear.
		await expect( postSearcher ).toMatchElement( '.autocomplete__option', { text: /hello world/i } );
		await expect( postSearcher ).toMatchElement( '.autocomplete__option', { text: /hello solar system/i } );
		await expect( postSearcher ).toMatchElement( '.autocomplete__option', { text: /hello universe/i } );

		// Select the post.
		await expect( postSearcher ).toClick( '.autocomplete__option', { text: /hello world/i } );
		// Search input becomes the post title
		expect( await page.$eval( '.googlesitekit-post-searcher input', ( el ) => el.value ) ).toEqual( 'Hello world!' );

		await Promise.all( [
			page.waitForNavigation(),
			expect( postSearcher ).toClick( 'button', { text: /view data/i } ),
		] );

		await expect( page ).toMatchElement( '.googlesitekit-page-header__title', { text: /detailed page stats/i } );
		await expect( page ).toMatchElement( '.googlesitekit-dashboard-single-url__title', { text: 'Hello world!' } );
	} );
} );
