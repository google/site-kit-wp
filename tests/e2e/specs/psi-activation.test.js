/**
 * WordPress dependencies
 */
import { switchUserToAdmin, visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'PageSpeed Insights Activation', () => {
	beforeEach( async() => {
	} );

	afterEach( async() => {
	} );

	it( 'Dashboard should display Activate PageSpeed Insights CTA', async() => {
		await switchUserToAdmin();
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
		await page.waitForSelector( '.googlesitekit-cta__title' );
		const welcomeTitle = await page.$x(
			'//h3[contains(@class,"googlesitekit-cta__title") and contains(text(), "Activate PageSpeed Insights.")]'
		);
		expect( welcomeTitle.length ).not.toEqual( 0 );

	} );

	it( 'Should lead you to the activation page', async() => {
		const setupButton = await page.$x(
			'//a[contains(@class,"googlesitekit-cta-link")]'
		);

		expect( setupButton.length ).not.toEqual( 0 );

		await setupButton[1].click();
		await page.waitForSelector( '.googlesitekit-setup-module__title' );

		const psiHeader = await page.$x(
			'//h2[contains(@class,"googlesitekit-setup-module__title") and contains(text(), "PageSpeed Insights")]'
		);

		expect( psiHeader.length ).not.toEqual( 0 );


	} );
} );
