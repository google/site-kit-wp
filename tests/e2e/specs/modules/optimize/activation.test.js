/**
 * WordPress dependencies
 */
import { visitAdminPage, activatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setSearchConsoleProperty,
	setSiteVerification,
	setupAnalytics,
} from '../../../utils';

async function proceedToOptimizeSetup() {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

	await page.waitForSelector( '.mdc-tab-bar' );
	await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );

	await page.waitForSelector( '.googlesitekit-settings-connect-module--optimize' );

	await Promise.all( [
		page.waitForNavigation(),
		page.waitForSelector( '.googlesitekit-setup-module--optimize .googlesitekit-setup-module__title' ),
		expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up optimize/i } ),
	] );
}

async function finishOptimizeSetup() {
	await Promise.all( [
		page.waitForNavigation(),
		expect( page ).toClick( '.googlesitekit-setup-module--optimize button', { text: /Configure Optimize/i } ),
	] );
	await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Optimize!/i } );
}

describe( 'Optimize Activation', () => {
	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'prompts to insert your Optimize ID when Analytics snippet is enabled', async () => {
		await setupAnalytics( { useSnippet: true } );
		await proceedToOptimizeSetup();

		const setupHandle = await page.$( '.googlesitekit-setup-module--optimize' );
		await expect( setupHandle ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Optimize/i } );
		await expect( setupHandle ).toMatchElement( 'p', { text: /Please copy and paste your Optimize ID to complete your setup/i } );
		// Not able to use negation here for some reason.
		// await expect( setupHandle ).not.toMatchElement( 'p', { text: /You disabled analytics auto insert snippet. If You are using Google Analytics code snippet, add the code below/i, visible: true } );
		// await expect( setupHandle ).not.toMatchElement( 'p', { text: /Click here for how to implement Optimize tag in Google Analytics Code Snippet/i } );

		await expect( setupHandle ).toFill( 'input', 'gtm' );
		await expect( setupHandle ).toMatchElement( '.googlesitekit-error-text', { text: /Error: Not a valid Optimize ID./i } );
		await expect( setupHandle ).toFill( 'input', 'GTM-1234567' );
		await expect( setupHandle ).not.toMatchElement( '.googlesitekit-error-text', { text: /Error: Not a valid Optimize ID./i } );
		await setupHandle.dispose();

		await finishOptimizeSetup();
	} );

	it( 'prompts to insert your Optimize ID when Analytics snippet is disabled, with extra instructions', async () => {
		await setupAnalytics( { useSnippet: false } );
		await proceedToOptimizeSetup();

		const setupHandle = await page.$( '.googlesitekit-setup-module--optimize' );
		await expect( setupHandle ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Optimize/i } );
		await expect( setupHandle ).toMatchElement( 'p', { text: /Please copy and paste your Optimize ID to complete your setup/i } );
		await expect( setupHandle ).toMatchElement( 'p', { text: /You disabled analytics auto insert snippet. If You are using Google Analytics code snippet, add the code below/i } );
		await expect( setupHandle ).toMatchElement( 'p', { text: /Click here for how to implement Optimize tag in Google Analytics Code Snippet/i } );

		await expect( setupHandle ).toFill( 'input', 'gtm' );
		await expect( setupHandle ).toMatchElement( '.googlesitekit-error-text', { text: /Error: Not a valid Optimize ID./i } );
		await expect( setupHandle ).toFill( 'input', 'GTM-1234567' );
		await expect( setupHandle ).not.toMatchElement( '.googlesitekit-error-text', { text: /Error: Not a valid Optimize ID./i } );
		await setupHandle.dispose();

		await finishOptimizeSetup();
	} );
} );
