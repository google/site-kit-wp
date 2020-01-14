/**
 * Internal dependencies
 */
import { getMetaKeyForUserOption } from '../';

const valuesToTest = [
	[
		'test_user_option',
		{ blogPrefix: '', isNetworkMode: false },
		'test_user_option',
	],
	[
		'test_user_option',
		{ blogPrefix: 'wp_', isNetworkMode: false },
		'wp_test_user_option',
	],
	[
		'test_user_option',
		{ blogPrefix: 'wp_1_', isNetworkMode: false },
		'wp_1_test_user_option',
	],
	[
		'test_user_option',
		{ blogPrefix: '', isNetworkMode: true },
		'test_user_option',
	],
	[
		'test_user_option',
		{ blogPrefix: 'wp_', isNetworkMode: true },
		'test_user_option',
	],
	[
		'test_user_option',
		{ blogPrefix: 'wp_1_', isNetworkMode: true },
		'test_user_option',
	],
];

describe( 'getMetaKeyForUserOption', () => {
	it.each( valuesToTest )( 'should format the user option %s with _googlesitekitBase %p', ( userOptionName, _googlesitekitBase, expected ) => {
		expect( getMetaKeyForUserOption( userOptionName, _googlesitekitBase ) ).toStrictEqual( expected );
	} );
} );
