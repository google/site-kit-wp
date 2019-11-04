/**
 * Internal dependencies
 */
import { toggleConfirmModuleSettings } from '../';

describe( 'toggleConfirmModuleSettings', () => {
	it( 'should toggle settings for analytics module', ( ) => {
		const googlesitekit = {
			modules: {
				analytics: {
					settings: { accountID: '12345678' },
					setupComplete: true,
					confirm: true,
				},
			},
		};

		const settings = {
			selectedAccount: '12345678',
		};

		expect(
			toggleConfirmModuleSettings(
				'analytics',
				{ selectedAccount: 'accountID' },
				settings,
				true,
				googlesitekit
			)
		).toStrictEqual( false );
	} );

	it( 'should not toggle (and return void) when setup is not complete', ( ) => {
		const googlesitekit = {
			modules: {
				adsense: {
					settings: { accountID: '99999999' },
					setupComplete: false,
					confirm: true,
				},
				analytics: {
					settings: { accountID: '12345678' },
					setupComplete: true,
					confirm: true,
				},
			},
		};

		const settings = {
			selectedAccount: '99999999',
		};

		expect(
			toggleConfirmModuleSettings(
				'adsense',
				{ selectedAccount: 'accountID' },
				settings,
				true,
				googlesitekit
			)
		).not.toBeDefined();
	} );
} );
