/**
 * Internal dependencies
 */
import { storageAvailable } from '../';

const valuesToTest = [
	[
		'localStorage',
		true,
		false
	],
	[
		'sessionStorage',
		true,
		false
	],
	[
		'localStorage',
		false,
		true
	],
	[
		'sessionStorage',
		false,
		true
	],
	[
		'nonExistantStorage',
		false,
		false
	]
];

const setItem = Storage.prototype.setItem;

describe( 'storageAvailable', () => {
	it.each( valuesToTest )( 'for case %s should return %p', ( type, expected, disableStorage ) => {
		if ( disableStorage ) {
			Storage.prototype.setItem = function() {
				throw new Error( 'error' );
			};
		}

		const actual = storageAvailable( type );

		Storage.prototype.setItem = setItem;

		expect( actual ).toStrictEqual( expected );
	} );
} );
