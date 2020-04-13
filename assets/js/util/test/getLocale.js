/**
 * Internal dependencies
 */
import { getLocale } from '../';

describe( 'getLocale', () => {
	const siteKitLocales = [
		[
			'en',
			'en',
		],
		[
			'en_CA',
			'en-CA',
		],
		[
			'de_DE_formal',
			'de-DE',
		],
		[
			'de_CH_informal',
			'de-CH',
		],
		[
			'pt_PT_ao90',
			'pt-PT',
		],
		[
			'sr-Latn-RS',
			'sr',
		],
	];

	it.each( siteKitLocales )( 'Site Kit locale %s returns as %s', ( value, expected ) => {
		expect( getLocale(
			{
				googlesitekit: {
					locale: {
						'': {
							lang: value,
						},
					},
				},
			}
		) ).toStrictEqual( expected );
	} );
} );
