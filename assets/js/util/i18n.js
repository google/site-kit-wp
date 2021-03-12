/**
 * Internationalization Utilities.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import { get, isFinite, isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf, _x } from '@wordpress/i18n';

/**
 * Converts seconds to a display ready string indicating
 * the number of hours, minutes and seconds that have elapsed.
 *
 * For example, passing 65 returns '1m 5s'.
 *
 * @since 1.0.0
 * @since 1.28.0 Refactored and renamed to improve localization.
 * @private
 *
 * @param {number}                     seconds   The number of seconds.
 * @param {(Intl.NumberFormatOptions)} [options] Optional formatting options.
 * @return {string} Human readable string indicating time elapsed.
 */
const durationFormat = ( seconds, options = {} ) => {
	options = {
		unitDisplay: 'short',
		...options,
		style: 'unit',
	};

	// Some browsers, e.g. Safari, throw a RangeError when options.style is
	// not one of decimal, percent, or currency.
	function testNumberFormat() {
		try {
			// test call to numberFormat
			numberFormat( 10, {
				...options,
				unit: 'hour',
			} );
			return true;
		} catch ( e ) {
			return false;
		}
	}

	const browserSupportsStyleUnit = testNumberFormat();
	let formattedString = '';

	if ( ! browserSupportsStyleUnit ) {
		options.style = 'decimal';
	}

	seconds = parseInt( seconds, 10 );

	if ( Number.isNaN( seconds ) ) {
		seconds = 0;
	}

	let hours = Math.floor( seconds / 60 / 60 ) || '';
	let minutes = Math.floor( ( seconds / 60 ) % 60 ) || '';

	seconds = Math.floor( seconds % 60 ) || '';

	if ( ! hours && ! minutes && ! seconds ) {
		seconds = 0;
	}

	if ( hours ) {
		hours = numberFormat( hours, {
			...options,
			unit: 'hour',
		} );
	}

	if ( minutes ) {
		minutes = numberFormat( minutes, {
			...options,
			unit: 'minute',
		} );
	}

	if ( '' !== seconds ) {
		seconds = numberFormat( seconds, {
			...options,
			unit: 'second',
		} );
	}

	//  Use a fully internationalized approach in browsers that support it, with a fallback to XXh YYm ZZs.
	if ( browserSupportsStyleUnit ) {
		formattedString = sprintf(
		/* translators: 1: formatted seconds, 2: formatted minutes, 3: formatted hours */
			_x( '%3$s %2$s %1$s', 'duration of time: hh mm ss', 'google-site-kit' ),
			seconds,
			minutes,
			hours,
		);
	} else {
		formattedString =
		( hours ? hours + 'h ' : '' ) +
		( minutes ? minutes + 'm ' : '' ) +
		( seconds ? seconds + 's ' : '' );
	}

	return formattedString.trim();
};

/**
 * Prepares a number to be used in readableLargeNumber.
 *
 * @since 1.7.0
 *
 * @param {number} number The large number to prepare.
 * @return {number} The prepared number.
 */
export const prepareForReadableLargeNumber = ( number ) => {
	if ( 1000000 <= number ) {
		return Math.round( number / 100000 ) / 10;
	}

	if ( 10000 <= number ) {
		return Math.round( number / 1000 );
	}

	if ( 1000 <= number ) {
		return Math.round( number / 100 ) / 10;
	}
	return number;
};

/**
 * Formats a large number for shortened display.
 *
 * @since 1.0.0
 *
 * @param {number} number The large number to format.
 * @return {string} The formatted number.
 */
export const readableLargeNumber = ( number ) => {
	const withSingleDecimal = {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	};

	// Numbers over 1,000,000 round normally and display a single decimal unless the decimal is 0.
	if ( 1000000 <= number ) {
		return sprintf(
			// translators: %s: an abbreviated number in millions.
			__( '%sM', 'google-site-kit' ),
			numberFormat( prepareForReadableLargeNumber( number ), number % 10 === 0 ? {} : withSingleDecimal )
		);
	}

	// Numbers between 10,000 and 1,000,000 round normally and have no decimals
	if ( 10000 <= number ) {
		return sprintf(
			// translators: %s: an abbreviated number in thousands.
			__( '%sK', 'google-site-kit' ),
			numberFormat( prepareForReadableLargeNumber( number ) )
		);
	}

	// Numbers between 1,000 and 10,000 round normally and display a single decimal unless the decimal is 0.
	if ( 1000 <= number ) {
		return sprintf(
			// translators: %s: an abbreviated number in thousands.
			__( '%sK', 'google-site-kit' ),
			numberFormat( prepareForReadableLargeNumber( number ), number % 10 === 0 ? {} : withSingleDecimal )
		);
	}

	return numberFormat( number, {
		signDisplay: 'never',
		maximumFractionDigits: 1,
	} );
};

/**
 * Formats a number with unit using the JS Internationalization Number Format API.
 *
 * In addition to the supported 'style' values of the lower-level `numberFormat` function, this function
 * supports two additional 'style' values 'metric' and 'duration' (expects a number in seconds).
 *
 * Another differentiation in behavior is that by default the function will use 'metric' formatting instead
 * of 'decimal' formatting.
 *
 * @since 1.24.0
 *
 * @param {number|string}                     number    The number to format.
 * @param {(Intl.NumberFormatOptions|string)} [options] Formatting options or unit shorthand.
 *                                                      Possible shorthand values are '%', 's',
 *                                                      or a currency code.
 * @return {string} The formatted number.
 */
export const numFmt = ( number, options = {} ) => {
	// Cast parsable values to numeric types.
	number = isFinite( number ) ? number : Number( number );

	if ( ! isFinite( number ) ) {
		// eslint-disable-next-line no-console
		console.warn( 'Invalid number', number, typeof number );
		number = 0;
	}

	let formatOptions = {};

	// Expand shorthand values for units.
	if ( '%' === options ) {
		formatOptions = {
			style: 'percent',
			maximumFractionDigits: 2,
		};
	} else if ( 's' === options ) {
		return durationFormat( number, {
			unitDisplay: 'narrow',
		} );
	} else if ( !! options && typeof options === 'string' ) {
		formatOptions = {
			style: 'currency',
			currency: options,
		};
	} else if ( isPlainObject( options ) ) {
		formatOptions = { ...options };
	}

	// Note: `metric` is our custom, default style.
	const { style = 'metric' } = formatOptions;

	if ( 'metric' === style ) {
		return readableLargeNumber( number );
	} else if ( 'duration' === style ) {
		return durationFormat( number, options );
	}

	return numberFormat( number, formatOptions );
};

/**
 * Formats a number using the JS Internationalization Number Format API.
 *
 * @since 1.8.0
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat/NumberFormat|`options` parameter} For all available formatting options.
 *
 * @param {number}                   number           The number to format.
 * @param {Intl.NumberFormatOptions} [options]        Formatting options.
 * @param {string}                   [options.locale] Locale to use for formatting. Defaults to current locale used by Site Kit.
 * @return {string} The formatted number.
 */
export const numberFormat = ( number, options = {} ) => {
	const { locale = getLocale(), ...formatOptions } = options;

	return new Intl.NumberFormat( locale, formatOptions ).format( number );
};

/**
 * Flattens an array of strings into a string using the JS Internationalization List Format API.
 *
 * @since 1.23.0
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat|`options` parameter} For all available options.
 *
 * @param {Array}  list             The list to flatten.
 * @param {Object} [options]        Formatting options.
 * @param {string} [options.locale] Locale to use for formatting. Defaults to current locale used by Site Kit.
 * @param {string} [options.style]  Length of the formatted message. Defaults to long.
 * @param {string} [options.type]   Type of list. Defaults to 'conjunction' (A, B, and C).
 *                                  Also available 'disjunction' (A, B, or C)
 *                                  Also available 'unit' (5 pounds, 12 ounces)
 * @return {string} The flattened list.
 */
export const listFormat = ( list, options = {} ) => {
	const { locale = getLocale(), style = 'long', type = 'conjunction' } = options;

	// Not all browsers support Intl.Listformat per
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat#Browser_compatibility
	// We've seen that the built versions don't polyfill for the unsupported browsers (iOS/safari) so we provide a fallback.
	if ( Intl.ListFormat ) {
		const formatter = new Intl.ListFormat( locale, { style, type } );
		return formatter.format( list );
	}

	/* translators: used between list items, there is a space after the comma. */
	const listSeparator = __( ', ', 'google-site-kit' );
	return list.join( listSeparator );
};

/**
 * Gets the current locale for use with browser APIs.
 *
 * @since 1.8.0
 *
 * @param {Object} _global The global window object.
 * @return {string} Current Site Kit locale if set, otherwise the current language set by the browser.
 *                  E.g. `en-US` or `de-DE`
 */
export const getLocale = ( _global = global ) => {
	const siteKitLocale = get( _global, [ '_googlesitekitLegacyData', 'locale' ] );
	if ( siteKitLocale ) {
		const matches = siteKitLocale.match( /^(\w{2})?(_)?(\w{2})/ );
		if ( matches && matches[ 0 ] ) {
			return matches[ 0 ].replace( /_/g, '-' );
		}
	}

	return _global.navigator.language;
};
