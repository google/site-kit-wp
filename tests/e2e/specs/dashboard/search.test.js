/**
 * WordPress dependencies
 */
import { activatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { setSiteVerification, setSearchConsoleProperty } from '../../utils';

describe( 'Site Kit dashboard post search', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	beforeEach( async () => {
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
		expect( await postSearcher.$eval( 'input', ( el ) => el.value ) ).toEqual( 'Hello world!' );

		await Promise.all( [
			page.waitForNavigation(),
			expect( postSearcher ).toClick( 'button', { text: /view data/i } ),
		] );

		await expect( page ).toMatchElement( '.googlesitekit-page-header__title', { text: /detailed page stats/i } );
		await expect( page ).toMatchElement( '.googlesitekit-dashboard-single-url__title', { text: 'Hello world!' } );
	} );

	it( 'displays results when searching with a URL, and loads the details page when clicking View Data', async () => {
		const postSearcher = await page.$( '.googlesitekit-post-searcher' );

		await expect( postSearcher ).toFill( 'input', createURL( 'hello-world' ) );

		// Ensure expected options appear.
		await expect( postSearcher ).toMatchElement( '.autocomplete__option', { text: /hello world/i } );
		// Ensure no other options are displayed.
		expect( await postSearcher.$$( '.autocomplete__option' ) ).toHaveLength( 1 );

		// Select the post.
		await expect( postSearcher ).toClick( '.autocomplete__option', { text: /hello world/i } );
		// Search input becomes the post title
		expect( await postSearcher.$eval( 'input', ( el ) => el.value ) ).toEqual( 'Hello world!' );

		await Promise.all( [
			page.waitForNavigation(),
			expect( postSearcher ).toClick( 'button', { text: /view data/i } ),
		] );

		await expect( page ).toMatchElement( '.googlesitekit-page-header__title', { text: /detailed page stats/i } );
		await expect( page ).toMatchElement( '.googlesitekit-dashboard-single-url__title', { text: 'Hello world!' } );
	} );

	it( 'displays "No results found" when searching by title if no post is found', async () => {
		const postSearcher = await page.$( '.googlesitekit-post-searcher' );

		await expect( postSearcher ).toFill( 'input', 'non-existent title' );

		await expect( postSearcher ).toMatchElement( '.autocomplete__option', { text: /no results found/i } );

		// Ensure no other options are displayed.
		expect( await postSearcher.$$( '.autocomplete__option' ) ).toHaveLength( 1 );
	} );

	it( 'displays "No results found" when searching by URL if no post is found', async () => {
		const postSearcher = await page.$( '.googlesitekit-post-searcher' );

		await expect( postSearcher ).toFill( 'input', createURL( 'non-existent' ) );

		await expect( postSearcher ).toMatchElement( '.autocomplete__option', { text: /no results found/i } );

		// Ensure no other options are displayed.
		expect( await postSearcher.$$( '.autocomplete__option' ) ).toHaveLength( 1 );
	} );

	it( 'works with post titles containing special characters', async () => {
		const TITLE_SPECIAL_CHARACTERS = 'Hello Spéçïåł čhāràćtęrß!';
		const postSearcher = await page.$( '.googlesitekit-post-searcher' );

		await expect( postSearcher ).toFill( 'input', 'Spéçïåł' );

		// Ensure expected options appear.
		await expect( postSearcher ).toMatchElement( '.autocomplete__option', { text: TITLE_SPECIAL_CHARACTERS } );
		// Ensure no other options are displayed.
		expect( await postSearcher.$$( '.autocomplete__option' ) ).toHaveLength( 1 );

		// Select the post.
		await expect( postSearcher ).toClick( '.autocomplete__option', { text: TITLE_SPECIAL_CHARACTERS } );
		// Search input becomes the post title
		expect( await postSearcher.$eval( 'input', ( el ) => el.value ) ).toEqual( TITLE_SPECIAL_CHARACTERS );

		await Promise.all( [
			page.waitForNavigation(),
			expect( postSearcher ).toClick( 'button', { text: /view data/i } ),
		] );

		await expect( page ).toMatchElement( '.googlesitekit-page-header__title', { text: /detailed page stats/i } );
		await expect( page ).toMatchElement( '.googlesitekit-dashboard-single-url__title', { text: TITLE_SPECIAL_CHARACTERS } );
	} );
} );
