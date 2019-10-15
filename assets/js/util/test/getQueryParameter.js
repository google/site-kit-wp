/**
 * Internal dependencies
 */
import { getQueryParameter } from '../';

describe( 'getQueryParameter', () => {
	const createLocation = ( queryString ) => {
		return { href: `https://example.com?${ queryString }` };
	};

	it( 'should return the correct query param values', () => {
		let location = createLocation( 'foo=bar&x=1' );
		expect( getQueryParameter( 'foo', location ) ).toStrictEqual( 'bar' );

		location = createLocation( 'bar=foo&x=1' );
		expect( getQueryParameter( 'bar', location ) ).toStrictEqual( 'foo' );

		location = createLocation( 'foo=bar&x=1' );
		expect( getQueryParameter( 'x', location ) ).toStrictEqual( '1' );

		location = createLocation( 'foo=bar&y=2&x=1' );
		expect( getQueryParameter( 'y', location ) ).toStrictEqual( '2' );

		location = createLocation( 'x=x&y=x&xx=x' );
		expect( getQueryParameter( 'x', location ) ).toStrictEqual( 'x' );
		expect( getQueryParameter( 'y', location ) ).toStrictEqual( 'x' );
	} );
} );
