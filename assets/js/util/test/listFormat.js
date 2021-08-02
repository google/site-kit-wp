/**
 * Internal dependencies
 */
import { listFormat } from '../';

describe( 'listFormat', () => {
	it( 'flattens a list of strings correctly according to the locale provided', () => {
		expect( listFormat( [ 'A', 'B' ] ) ).toStrictEqual( 'A and B' );

		expect(
			listFormat( [ 'A', 'B', 'C' ], {
				locale: 'en-US',
				type: 'conjunction',
			} )
		).toStrictEqual( 'A, B, and C' );

		expect(
			listFormat( [ 'A', 'B', 'C' ], {
				locale: 'en-US',
				type: 'disjunction',
			} )
		).toStrictEqual( 'A, B, or C' );

		expect(
			listFormat( [ 'A', 'B', 'C' ], { locale: 'en-US', style: 'short' } )
		).toStrictEqual( 'A, B, & C' );

		expect(
			listFormat( [ 'A', 'B', 'C' ], {
				locale: 'en-US',
				style: 'short',
				type: 'unit',
			} )
		).toStrictEqual( 'A, B, C' );
	} );

	afterEach( () => {
		global._googlesitekitLegacyData = null;
	} );

	const siteKitLocales = [
		[
			'en-US',
			[ 'John', 'Paul', 'George', 'Ringo' ],
			'John, Paul, George, and Ringo',
		],
		[ 'de-DE', [ 'Donau', 'Rhein', 'Elbe' ], 'Donau, Rhein und Elbe' ],
		[ 'zh-ZH', [ '鼠', '牛', '虎' ], '鼠、牛和虎' ],
		[
			'ru-RU',
			[ 'Достоевский', 'Пушкин', 'Толстой' ],
			'Достоевский, Пушкин и Толстой',
		],
	];

	it.each( siteKitLocales )(
		'flattens lists correctly with locale variant %s',
		( locale, value, expected ) => {
			expect( listFormat( value, { locale } ) ).toStrictEqual( expected );
		}
	);
} );
