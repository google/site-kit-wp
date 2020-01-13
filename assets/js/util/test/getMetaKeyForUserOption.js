/**
 * Internal dependencies
 */
import { getMetaKeyForUserOption } from '../';

const valuesToTest = [
	[
		'test_user_option',
		{ blogPrefix: '' },
		'test_user_option',
	],
	[
		'test_user_option',
		{ blogPrefix: 'wp_' },
		'wp_test_user_option',
	],
	[
		'test_user_option',
		{ blogPrefix: 'wp_1_' },
		'wp_1_test_user_option',
	],
];

describe( 'getMetaKeyForUserOption', () => {
	it.each( valuesToTest )( 'should format the user option %s with _googlesitekitBase %p', ( userOptionName, _googlesitekitBase, expected ) => {
		expect( getMetaKeyForUserOption( userOptionName, _googlesitekitBase ) ).toStrictEqual( expected );
	} );
} );
