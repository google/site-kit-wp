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
import memize from 'memize';

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
 * @param {number}                     durationInSeconds The number of seconds.
 * @param {(Intl.NumberFormatOptions)} [options]         Optional formatting options.
 * @return {string} Human readable string indicating time elapsed.
 */
const durationFormat = ( durationInSeconds, options = {} ) => {
	const { formatUnit, formatDecimal } = createDurationFormat(
		durationInSeconds,
		options
	);

	try {
		// Some browsers, e.g. Safari, throw a RangeError when options.style is
		// not one of decimal, percent, or currency.
		return formatUnit();
	} catch {
		// Fallback to XXh YYm ZZs using localized decimals with hardcoded units.
		return formatDecimal();
	}
};

/**
 * Converts seconds to a display ready string indicating
 * the number of hours, minutes and seconds that have elapsed
 * in ISO format - HH:mm:ss.
 *
 * If the duration is less than an hour, the HH part of the string
 * is truncated.
 * For example, passing 65 returns '01:05'.
 * Passing 5400 returns '01:30:00'.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {number} durationInSeconds The number of seconds.
 * @return {string} Human readable string indicating time elapsed.
 */
const durationISOFormat = ( durationInSeconds ) => {
	let { hours, minutes, seconds } = parseDuration( durationInSeconds );

	seconds = ( '0' + seconds ).slice( -2 );
	minutes = ( '0' + minutes ).slice( -2 );
	hours = ( '0' + hours ).slice( -2 );

	return hours === '00'
		? `${ minutes }:${ seconds }`
		: `${ hours }:${ minutes }:${ seconds }`;
};

/**
 * Parses the duration in seconds into hours, minutes and seconds.
 *
 * @since n.e.x.t
 * @private
 *
 * @param {number} durationInSeconds The number of seconds.
 * @return {Object} Number of hours, minutes and seconds equivalent
 * to the given duration in seconds.
 */
const parseDuration = ( durationInSeconds ) => {
	durationInSeconds = parseInt( durationInSeconds, 10 );

	if ( Number.isNaN( durationInSeconds ) ) {
		durationInSeconds = 0;
	}

	const hours = Math.floor( durationInSeconds / 60 / 60 );
	const minutes = Math.floor( ( durationInSeconds / 60 ) % 60 );
	const seconds = Math.floor( durationInSeconds % 60 );

	return { hours, minutes, seconds };
};

/**
 * Creates duration formatting utilities.
 *
 * Not intended to be used directly.
 * Use `numFmt( number, { style: 'duration' } )` instead.
 *
 * @since 1.29.0
 * @private
 *
 * @param {number} durationInSeconds Duration to format.
 * @param {Object} [options]         Formatting options.
 * @return {Object} Formatting functions.
 */
export const createDurationFormat = ( durationInSeconds, options = {} ) => {
	const { hours, minutes, seconds } = parseDuration( durationInSeconds );

	return {
		hours,
		minutes,
		seconds,
		formatUnit() {
			const { unitDisplay = 'short', ...restOptions } = options;
			const commonOptions = {
				unitDisplay,
				...restOptions,
				style: 'unit',
			};

			if ( durationInSeconds === 0 ) {
				return numberFormat( seconds, {
					...commonOptions,
					unit: 'second',
				} );
			}

			return sprintf(
				/* translators: 1: formatted seconds, 2: formatted minutes, 3: formatted hours */
				_x(
					'%3$s %2$s %1$s',
					'duration of time: hh mm ss',
					'google-site-kit'
				),
				seconds
					? numberFormat( seconds, {
							...commonOptions,
							unit: 'second',
					  } )
					: '',
				minutes
					? numberFormat( minutes, {
							...commonOptions,
							unit: 'minute',
					  } )
					: '',
				hours
					? numberFormat( hours, { ...commonOptions, unit: 'hour' } )
					: ''
			).trim();
		},
		/**
		 * Formats the duration using integers and translatable strings.
		 * This is only used as a fallback when the above `formatUnit` fails.
		 *
		 * @since 1.29.0
		 *
		 * @return {string} Formatted duration.
		 */
		formatDecimal() {
			const formattedSeconds = sprintf(
				// translators: %s: number of seconds with "s" as the abbreviated unit.
				__( '%ds', 'google-site-kit' ),
				seconds
			);

			if ( durationInSeconds === 0 ) {
				return formattedSeconds;
			}

			const formattedMinutes = sprintf(
				// translators: %s: number of minutes with "m" as the abbreviated unit.
				__( '%dm', 'google-site-kit' ),
				minutes
			);
			const formattedHours = sprintf(
				// translators: %s: number of hours with "h" as the abbreviated unit.
				__( '%dh', 'google-site-kit' ),
				hours
			);

			return sprintf(
				/* translators: 1: formatted seconds, 2: formatted minutes, 3: formatted hours */
				_x(
					'%3$s %2$s %1$s',
					'duration of time: hh mm ss',
					'google-site-kit'
				),
				seconds ? formattedSeconds : '',
				minutes ? formattedMinutes : '',
				hours ? formattedHours : ''
			).trim();
		},
	};
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
			numberFormat(
				prepareForReadableLargeNumber( number ),
				number % 10 === 0 ? {} : withSingleDecimal
			)
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
			numberFormat(
				prepareForReadableLargeNumber( number ),
				number % 10 === 0 ? {} : withSingleDecimal
			)
		);
	}

	return numberFormat( number, {
		signDisplay: 'never',
		maximumFractionDigits: 1,
	} );
};

/**
 * Parses formatting options and returns an object with options for selected formatting.
 *
 * @since 1.103.0
 *
 * @param {(Intl.NumberFormatOptions|string)} options Formatting options or unit shorthand. Possible shorthand values are '%', 's', or a currency code.
 * @return {Object} Formatting options.
 */
export function expandNumFmtOptions( options ) {
	let formatOptions = {};

	// Expand shorthand values for units.
	if ( '%' === options ) {
		formatOptions = {
			style: 'percent',
			maximumFractionDigits: 2,
		};
	} else if ( 's' === options ) {
		formatOptions = {
			style: 'duration',
			unitDisplay: 'narrow',
		};
	} else if ( !! options && typeof options === 'string' ) {
		formatOptions = {
			style: 'currency',
			currency: options,
		};
	} else if ( isPlainObject( options ) ) {
		formatOptions = { ...options };
	}

	return formatOptions;
}

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
export function numFmt( number, options = {} ) {
	// Cast parsable values to numeric types.
	number = isFinite( number ) ? number : Number( number );

	if ( ! isFinite( number ) ) {
		// eslint-disable-next-line no-console
		console.warn( 'Invalid number', number, typeof number );
		number = 0;
	}

	const formatOptions = expandNumFmtOptions( options );
	const { style = 'metric' } = formatOptions; // Note: `metric` is our custom, default style.

	if ( 'metric' === style ) {
		return readableLargeNumber( number );
	}

	if ( 'duration' === style ) {
		return durationFormat( number, formatOptions );
	}

	if ( 'durationISO' === style ) {
		return durationISOFormat( number );
	}

	return numberFormat( number, formatOptions );
}

// Warn once for a given message.
const warnOnce = memize( console.warn ); // eslint-disable-line no-console

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

	try {
		/**
		 * Per https://github.com/google/site-kit-wp/issues/3255 there have been issues with some versions of Safari
		 * on some operating systems throwing issues with some parameters in the formatOptions.
		 *
		 * If an error is thrown, we remove some troublesome params from the formatOptions object and fallback to no formatting.
		 *
		 * This allows us to degrade somewhat gracefully without breaking the dashboard for users of unaffected browsers.
		 */
		return new Intl.NumberFormat( locale, formatOptions ).format( number );
	} catch ( error ) {
		warnOnce(
			`Site Kit numberFormat error: Intl.NumberFormat( ${ JSON.stringify(
				locale
			) }, ${ JSON.stringify(
				formatOptions
			) } ).format( ${ typeof number } )`,
			error.message
		);
	}

	// Remove these key/values from formatOptions.
	const unstableFormatOptionValues = {
		currencyDisplay: 'narrow',
		currencySign: 'accounting',
		style: 'unit',
	};

	// Remove these keys from formatOptions irrespective of value.
	const unstableFormatOptions = [ 'signDisplay', 'compactDisplay' ];

	const reducedFormatOptions = {};

	for ( const [ key, value ] of Object.entries( formatOptions ) ) {
		if (
			unstableFormatOptionValues[ key ] &&
			value === unstableFormatOptionValues[ key ]
		) {
			continue;
		}
		if ( unstableFormatOptions.includes( key ) ) {
			continue;
		}
		reducedFormatOptions[ key ] = value;
	}

	try {
		return new Intl.NumberFormat( locale, reducedFormatOptions ).format(
			number
		);
	} catch {
		return new Intl.NumberFormat( locale ).format( number );
	}
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
	const {
		locale = getLocale(),
		style = 'long',
		type = 'conjunction',
	} = options;

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
	const siteKitLocale = get( _global, [
		'_googlesitekitLegacyData',
		'locale',
	] );
	if ( siteKitLocale ) {
		const matches = siteKitLocale.match( /^(\w{2})?(_)?(\w{2})/ );
		if ( matches && matches[ 0 ] ) {
			return matches[ 0 ].replace( /_/g, '-' );
		}
	}

	return _global.navigator.language;
};
