/**
 * WordPress dependencies
 */
import { switchUserToAdmin, visitAdminPage, activatePlugin, deactivatePlugin } from '@wordpress/e2e-test-utils';
import { resetSiteKit } from '../utils/reset';

describe( 'PageSpeed Insights Activation', () => {
	beforeEach( async() => {
	} );

	afterEach( async() => {
	} );

	it( 'Dashboard should display Activate PageSpeed Insights CTA', async() => {

		await resetSiteKit();
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
		await page.waitForSelector( '.googlesitekit-cta__title' );
		const welcomeTitle = await page.$x(
			'//h3 [ contains( @class,"googlesitekit-cta__title") and contains( text(), "Activate PageSpeed Insights.")]'
		);
		expect( welcomeTitle.length ).not.toEqual( 0 );
	} );

	it( 'Setup PSI button should lead you to the activation page', async() => {
		const setupButton = await page.$x(
			'//a[contains(@class,"googlesitekit-cta-link" ) and contains( text(), "Activate PageSpeed Insights")]'
		);

		expect( setupButton.length ).not.toEqual( 0 );

		await setupButton[0].click();
		await page.waitForSelector( '.googlesitekit-setup-module__title' );

		const psiHeader = await page.$x(
			'//h2[ contains( @class,"googlesitekit-setup-module__title" ) and contains( text(), "PageSpeed Insights" ) ]'
		);

		expect( psiHeader.length ).not.toEqual( 0 );

	} );

	it ( 'Activating should submit the entered key.', async() => {

		// Enter the actication key.
		await page.type( 'input.mdc-text-field__input', 'PSIKEYTOSUBMITANDTEST' );

		const submit = await page.$x( '//button [contains( @class,"mdc-button" ) and contains( span, "Proceed" ) ]' );

		expect( submit.length ).not.toEqual( 0 );

		// Click the submit button.
		await submit[0].click();

		await page.waitForSelector( 'h3.googlesitekit-heading-3' );

		// Check that the correct key is saved on the settings page.
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		const tabs = await page.$x(
			'//button[contains(@class,"mdc-tab" ) ]'
		);

		// Open the Admin tab.
		await tabs[2].click();

		// Check the API Key text, verifying the submitted value has been stored.
		const apiKeyTextField = await page.$x(
			'//h5[contains(@class,"googlesitekit-settings-module__meta-item-data" ) ]'
		);
		const apiKeyText = await page.evaluate( h5 => h5.textContent, apiKeyTextField[2] );

		expect( apiKeyText ).toEqual( 'PSIKEYTOSUBMITANDTEST' );
	} );
} );
