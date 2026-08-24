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
import { __, _x, sprintf } from '@wordpress/i18n';

type NumberFormatStyle = NonNullable< Intl.NumberFormatOptions[ 'style' ] >;
type DurationUnit = 'second' | 'minute' | 'hour';
type ListFormatStyle = 'long' | 'short' | 'narrow';
type ListFormatType = 'conjunction' | 'disjunction' | 'unit';

type NumberFormatOptionsWithLocale = Intl.NumberFormatOptions & {
	locale?: string;
	style?: NumberFormatStyle;
	unit?: DurationUnit;
	unitDisplay?: 'short' | 'long' | 'narrow';
};

type DurationFormatOptions = Omit< NumberFormatOptionsWithLocale, 'style' > & {
	style?: Intl.NumberFormatOptions[ 'style' ] | 'duration';
};

type NumFmtOptions = Omit< NumberFormatOptionsWithLocale, 'style' > & {
	style?:
		| Intl.NumberFormatOptions[ 'style' ]
		| 'metric'
		| 'duration'
		| 'durationISO';
	locale?: string;
};

type ListFmtOptions = {
	locale?: string;
	style?: ListFormatStyle;
	type?: ListFormatType;
};

type IntlListFormatInstance = {
	format: ( list: string[] ) => string;
};

type IntlWithListFormat = typeof Intl & {
	ListFormat?: new (
		locale?: string | string[],
		options?: { style?: ListFormatStyle; type?: ListFormatType }
	) => IntlListFormatInstance;
};

type GlobalLike = typeof globalThis & {
	_googlesitekitLegacyData?: {
		locale?: string;
	};
};

function isNumberFormatOptionsObject(
	value: unknown
): value is NumberFormatOptionsWithLocale {
	return isPlainObject( value );
}

function toDurationFormatOptions(
	options: NumFmtOptions
): DurationFormatOptions {
	const { style: _style, ...rest } = options;
	void _style;

	return {
		...rest,
		style: 'duration',
	};
}

function toNumberFormatOptions(
	options: NumFmtOptions
): NumberFormatOptionsWithLocale {
	const { style, ...rest } = options;

	if (
		style &&
		style !== 'metric' &&
		style !== 'duration' &&
		style !== 'durationISO'
	) {
		return {
			...rest,
			style,
		};
	}

	return rest;
}

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
function durationFormat(
	durationInSeconds: number,
	options: DurationFormatOptions = {}
): string {
	const { formatUnit, formatDecimal } = createDurationFormat(
		durationInSeconds,
		options
	);

	try {
		return formatUnit();
	} catch {
		return formatDecimal();
	}
}

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
 * @since 1.111.0
 * @private
 *
 * @param {number} durationInSeconds The number of seconds.
 * @return {string} Human readable string indicating time elapsed.
 */
function durationISOFormat( durationInSeconds: number ): string {
	const { hours, minutes, seconds } = parseDuration( durationInSeconds );
	const paddedSeconds = ( '0' + seconds ).slice( -2 );
	const paddedMinutes = ( '0' + minutes ).slice( -2 );
	const paddedHours = ( '0' + hours ).slice( -2 );

	return paddedHours === '00'
		? `${ paddedMinutes }:${ paddedSeconds }`
		: `${ paddedHours }:${ paddedMinutes }:${ paddedSeconds }`;
}

/**
 * Parses the duration in seconds into hours, minutes and seconds.
 *
 * @since 1.111.0
 * @private
 *
 * @param {number} durationInSeconds The number of seconds.
 * @return {Object} Number of hours, minutes and seconds equivalent
 * to the given duration in seconds.
 */
function parseDuration( durationInSeconds: number ): {
	hours: number;
	minutes: number;
	seconds: number;
} {
	durationInSeconds = parseInt( String( durationInSeconds ), 10 );

	if ( Number.isNaN( durationInSeconds ) ) {
		durationInSeconds = 0;
	}

	const hours = Math.floor( durationInSeconds / 60 / 60 );
	const minutes = Math.floor( ( durationInSeconds / 60 ) % 60 );
	const seconds = Math.floor( durationInSeconds % 60 );

	return { hours, minutes, seconds };
}

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
export function createDurationFormat(
	durationInSeconds: number,
	options: DurationFormatOptions = {}
): {
	hours: number;
	minutes: number;
	seconds: number;
	formatUnit: () => string;
	formatDecimal: () => string;
} {
	const { hours, minutes, seconds } = parseDuration( durationInSeconds );

	return {
		hours,
		minutes,
		seconds,
		formatUnit() {
			const {
				unitDisplay = 'short',
				style: _style,
				...restOptions
			} = options;
			void _style;
			const commonOptions: NumberFormatOptionsWithLocale = {
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
}

/**
 * Prepares a number to be used in readableLargeNumber.
 *
 * @since 1.7.0
 *
 * @param {number} number The large number to prepare.
 * @return {number} The prepared number.
 */
export function prepareForReadableLargeNumber( number: number ): number {
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
}

/**
 * Formats a large number for shortened display.
 *
 * @since 1.0.0
 *
 * @param {number} number The large number to format.
 * @return {string} The formatted number.
 */
export function readableLargeNumber( number: number ): string {
	const withSingleDecimal: NumberFormatOptionsWithLocale = {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1,
	};
	const maybeDecimalOptions =
		number % 10 === 0 ? undefined : withSingleDecimal;

	if ( 1000000 <= number ) {
		return sprintf(
			/* translators: %s: an abbreviated number in millions. */
			__( '%sM', 'google-site-kit' ),
			numberFormat(
				prepareForReadableLargeNumber( number ),
				maybeDecimalOptions
			)
		);
	}

	if ( 10000 <= number ) {
		return sprintf(
			/* translators: %s: an abbreviated number in thousands. */
			__( '%sK', 'google-site-kit' ),
			numberFormat( prepareForReadableLargeNumber( number ) )
		);
	}

	if ( 1000 <= number ) {
		return sprintf(
			/* translators: %s: an abbreviated number in thousands. */
			__( '%sK', 'google-site-kit' ),
			numberFormat(
				prepareForReadableLargeNumber( number ),
				maybeDecimalOptions
			)
		);
	}

	return numberFormat( number, {
		signDisplay: 'never',
		maximumFractionDigits: 1,
	} );
}

/**
 * Parses formatting options and returns an object with options for selected formatting.
 *
 * @since 1.103.0
 *
 * @param {(Intl.NumberFormatOptions|string)} options Formatting options or unit shorthand. Possible shorthand values are '%', 's', or a currency code.
 * @return {Object} Formatting options.
 */
export function expandNumFmtOptions(
	options: string | NumberFormatOptionsWithLocale
): NumFmtOptions {
	let formatOptions: NumFmtOptions = {};

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
	} else if ( !! options && 'string' === typeof options ) {
		formatOptions = {
			style: 'currency',
			currency: options,
		};
	} else if ( isNumberFormatOptionsObject( options ) ) {
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
export function numFmt(
	number: number | string,
	options: string | NumberFormatOptionsWithLocale = {}
): string {
	let numericValue = isFinite( number ) ? Number( number ) : Number( number );

	if ( ! isFinite( numericValue ) ) {
		// eslint-disable-next-line no-console
		console.warn( 'Invalid number', number, typeof number );
		numericValue = 0;
	}

	const formatOptions = expandNumFmtOptions( options );
	const { style = 'metric' } = formatOptions;

	if ( 'metric' === style ) {
		return readableLargeNumber( numericValue );
	}

	if ( 'duration' === style ) {
		return durationFormat(
			numericValue,
			toDurationFormatOptions( formatOptions )
		);
	}

	if ( 'durationISO' === style ) {
		return durationISOFormat( numericValue );
	}

	return numberFormat( numericValue, toNumberFormatOptions( formatOptions ) );
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
export function numberFormat(
	number: number,
	options: NumberFormatOptionsWithLocale = {}
): string {
	const { locale = getLocale(), ...formatOptions } = options;

	try {
		return new Intl.NumberFormat( locale, formatOptions ).format( number );
	} catch ( error ) {
		warnOnce(
			`Site Kit numberFormat error: Intl.NumberFormat( ${ JSON.stringify(
				locale
			) }, ${ JSON.stringify(
				formatOptions
			) } ).format( ${ typeof number } )`,
			( error as Error ).message
		);
	}

	const unstableFormatOptionValues: Record< string, unknown > = {
		currencyDisplay: 'narrow',
		currencySign: 'accounting',
		style: 'unit',
	};

	const unstableFormatOptions = [ 'signDisplay', 'compactDisplay' ];

	const reducedFormatOptions: Intl.NumberFormatOptions = {};

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

		reducedFormatOptions[ key as keyof Intl.NumberFormatOptions ] =
			value as never;
	}

	try {
		return new Intl.NumberFormat( locale, reducedFormatOptions ).format(
			number
		);
	} catch {
		return new Intl.NumberFormat( locale ).format( number );
	}
}

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
export function listFormat(
	list: string[],
	options: ListFmtOptions = {}
): string {
	const {
		locale = getLocale(),
		style = 'long',
		type = 'conjunction',
	} = options;

	const intlWithListFormat = Intl as IntlWithListFormat;
	if ( intlWithListFormat.ListFormat ) {
		const formatter = new intlWithListFormat.ListFormat( locale, {
			style,
			type,
		} );
		return formatter.format( list );
	}

	/* translators: used between list items, there is a space after the comma. */
	const listSeparator = __( ', ', 'google-site-kit' );
	return list.join( listSeparator );
}

/**
 * Gets the current locale for use with browser APIs.
 *
 * @since 1.8.0
 *
 * @param {Object} _global The global window object.
 * @return {string} Current Site Kit locale if set, otherwise the current language set by the browser.
 *                  E.g. `en-US` or `de-DE`
 */
export function getLocale(
	_global: GlobalLike = globalThis as GlobalLike
): string {
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
}
