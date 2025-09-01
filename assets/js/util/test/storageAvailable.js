/**
 * Internal dependencies
 */
import { storageAvailable } from '@/js/util';

const valuesToTest = [
	[ 'localStorage', true, false ],
	[ 'sessionStorage', true, false ],
	[ 'localStorage', false, true ],
	[ 'sessionStorage', false, true ],
	[ 'nonExistantStorage', false, false ],
];

describe( 'storageAvailable', () => {
	it.each( valuesToTest )(
		'for case %s should return %p',
		( type, expected, disableStorage ) => {
			if ( disableStorage ) {
				global[ type ].setItem.mockImplementationOnce( () => {
					throw new Error( 'error' );
				} );
			}

			const actual = storageAvailable( type );

			expect( actual ).toStrictEqual( expected );
		}
	);
} );
