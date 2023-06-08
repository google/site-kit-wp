/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	deactivatePlugin,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setAuthToken,
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
} from '../utils';

describe( 'Plugin Reset', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-proxy-credentials-plugin' );
		await setClientConfig();
		await setAuthToken();
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	beforeEach( async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await expect( page ).toMatchElement(
			'.googlesitekit-page-header__title',
			{
				text: 'Settings',
			}
		);

		await page.waitForSelector( 'a.mdc-tab' );

		// Click on Admin Settings Tab.
		await expect( page ).toClick( 'a.mdc-tab', { text: 'Admin Settings' } );
		await page.waitForSelector( '.googlesitekit-settings-module__footer' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'e2e-tests-proxy-credentials-plugin' );
	} );

	it( 'displays a confirmation dialog when clicking the "Reset Site Kit" link', async () => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', {
			text: 'Reset Site Kit',
		} );
		await page.waitForSelector( '.mdc-dialog--open .mdc-button' );

		await expect( page ).toMatchElement( '.mdc-dialog--open .mdc-button', {
			text: 'Reset',
		} );
	} );

	it( 'dismisses the reset confirmation dialog when clicking "Cancel"', async () => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', {
			text: 'Reset Site Kit',
		} );
		await page.waitForSelector( '.mdc-dialog--open button' );

		await expect( page ).toClick( '.mdc-dialog--open button', {
			text: 'Cancel',
		} );
	} );

	it( 'disconnects Site Kit by clicking the "Reset" button in the confirmation dialog', async () => {
		await page.waitForSelector( 'button.googlesitekit-cta-link' );

		await expect( page ).toClick( 'button.googlesitekit-cta-link', {
			text: 'Reset Site Kit',
		} );

		await page.waitForSelector( '.mdc-dialog--open .mdc-button' );

		await expect( page ).toClick( '.mdc-dialog--open .mdc-button', {
			text: 'Reset',
		} );

		// Foul hack to delete the focusTrap and prevent "You can't have a focus-trap without at least one focusable element"
		// error being thrown in the majority of test runs.
		// This is occurring as a result of the trapFocus() method being invoked here, I haven't established the root cause yet.
		// https://github.com/material-components/material-components-web/blob/3a1767ea4da308dbee272763a377deff39cf0471/packages/mdc-dialog/foundation.ts#L98-L116
		await page.evaluate( () => {
			window.findReactComponentInstance = function ( el ) {
				for ( const key in el ) {
					if ( key.startsWith( '__reactInternalInstance$' ) ) {
						const fiberNode = el[ key ];

						return (
							fiberNode &&
							fiberNode.return &&
							fiberNode.return.stateNode
						);
					}
				}
				return null;
			};

			const instance = window.findReactComponentInstance(
				document.querySelector( '.mdc-dialog--open' )
			);

			if ( instance ) {
				delete instance.focusTrap;
			}
		} );

		await page.waitForNavigation();

		// Ensure we're on the setup page
		await expect( page ).toMatchElement( '.googlesitekit-start-setup', {
			text: 'Sign in with Google',
		} );
	} );
} );
