/**
 * Internal dependencies
 */
import { numberFormatWithUnit } from '../';

/**
 * Sets the Site Kit locale to a (legacy) global variable.
 *
 * @since 1.7.0
 * @private
 *
 * @param {string} langCode The locale to set Site Kit to use. E.g. `en-US` or `de-DE`.
 * @return {Object} Site Kit configuration object.
 */
const setupGoogleSiteKit = ( langCode ) => {
	return global._googlesitekitLegacyData = {
		locale: langCode,
	};
};

// Unlike normal space. ASCII 32
// This `NO-BREAK SPACE` or HTML's `&nbsp;` is used by Intl.NumberFormat between unit and number. ASCII `194 160`
const NO_BREAK_SPACE = ' ';

describe( 'numberFormatWithUnit', () => {
	afterEach( () => {
		global._googlesitekitLegacyData = null;
	} );

	const siteKitLocales = [
		[
			'de_DE_formal',
			123.87,
			'%',
			`123,87${ NO_BREAK_SPACE }%`,

		],
		[
			'de_CH_informal',
			123.87,
			'%',
			'123.87%',
		],
		[
			'pt_PT_ao90',
			123.87,
			'%',
			'123,87%',
		],
		[
			'fr',
			123.87,
			'%',
			`123,87${ NO_BREAK_SPACE }%`,
		],
		[
			'en_US',
			123.87,
			'%',
			`123.87%`,
		],
		[
			'en_US',
			123.87,
			'USD',
			`$123.87`,
		],
		[
			'ur',
			123.87,
			'USD',
			`$${ NO_BREAK_SPACE }123.87`,
		],
	];

	it.each( siteKitLocales )( 'formats numbers correctly with locale variant %s', ( locale, number, unit, expected ) => {
		setupGoogleSiteKit( locale );
		expect( numberFormatWithUnit( number, unit ) ).toStrictEqual( expected );
	} );
} );
