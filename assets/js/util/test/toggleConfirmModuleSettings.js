/**
 * Internal dependencies
 */
import { toggleConfirmModuleSettings } from '../';

describe( 'toggleConfirmModuleSettings', () => {
	it( 'should toggle settings and return true when module state changes', () => {
		const googlesitekit = {
			modules: {
				analytics: {
					slug: 'analytics',
					name: 'Analytics',
					settings: { accountID: '12345678' },
					setupComplete: true,
					confirm: true,
				},
			},
		};

		const moduleState = {
			selectedAccount: '9999999',
		};

		expect(
			toggleConfirmModuleSettings(
				'analytics',
				{ selectedAccount: 'accountID' },
				moduleState,
				true,
				googlesitekit
			)
		).toStrictEqual( true );
	} );

	it( 'should not toggle and return false when modules settings have not changed', () => {
		const googlesitekit = {
			modules: {
				analytics: {
					slug: 'analytics',
					name: 'Analytics',
					settings: { accountID: '12345678' },
					setupComplete: true,
					confirm: true,
				},
			},
		};

		const moduleState = {
			selectedAccount: '12345678',
		};

		expect(
			toggleConfirmModuleSettings(
				'analytics',
				{ selectedAccount: 'accountID' },
				moduleState,
				true,
				googlesitekit
			)
		).toStrictEqual( false );
	} );

	it( 'should not toggle (and return void) when setup is not complete', ( ) => {
		const googlesitekit = {
			modules: {
				adsense: {
					slug: 'adsense',
					name: 'AdSense',
					settings: { accountID: '99999999' },
					setupComplete: false,
					confirm: true,
				},
				analytics: {
					slug: 'analytics',
					name: 'Analytics',
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
