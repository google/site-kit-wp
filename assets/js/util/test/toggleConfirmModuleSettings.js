/**
 * Internal dependencies
 */
import { toggleConfirmModuleSettings } from '../';

const valuesToTest = [
	[
		'analytics',
		{
			'selectedAccount': '12345678'
		},
		false
	],
	[
		'adsense',
		{
			'selectedAccount': '99999999'
		},
		true
	]
];

// Disable reason: Needs investigation.
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'toggleConfirmModuleSettings', () => {
	it.each( valuesToTest )( 'should toggle settings for %s module', ( module, settings, expected ) => {
		// eslint-disable-next-line no-undef
		global.googlesitekit.modules = window.googlesitekit.modules || {};
		// eslint-disable-next-line no-undef
		global.googlesitekit.modules.analytics = {
			settings: { accountId: '12345678' },
			setupComplete: true,
			confirm: true,
		};
		// eslint-disable-next-line no-undef
		global.googlesitekit.modules.adsense = {
			settings: { accountId: '99999999' },
			setupComplete: false,
			confirm: true,
		};

		expect( toggleConfirmModuleSettings( module, { selectedAccount: 'accountId' }, settings, true ) ).toStrictEqual( expected );
	} );
} );
