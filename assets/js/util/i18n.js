/**
 * Internationalization Utilities.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { get } from 'lodash';

/**
 * Formats a number using the JS Internationalization Number Format API.
 *
 * @since 1.8.0
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat/NumberFormat|`options` parameter} For all available formatting options.
 *
 * @param {number} number           The number to format.
 * @param {Object} [options]        Formatting options.
 * @param {string} [options.locale] Locale to use for formatting. Defaults to current locale used by Site Kit.
 * @return {string} The formatted number.
 */
export const numberFormat = ( number, options = {} ) => {
	const { locale = getLocale(), ...formatOptions } = options;

	return new Intl.NumberFormat( locale, formatOptions ).format( number );
};

/**
 * Formats a number with unit using the JS Internationalization Number Format API.
 *
 * @since n.e.x.t
 *
 * @param {number|string}    number           The number to format.
 * @param {string|undefined} unit             The unit for the number.
 * @param {Object}           [options]        Formatting options.
 * @param {string}           [options.locale] Locale to use for formatting. Defaults to current locale used by Site Kit.
 * @return {string} The formatted number with unit.
 */
export const numberFormatWithUnit = ( number, unit, options = {} ) => {
	if ( typeof number === 'string' ) {
		number = parseFloat( number );
	}
	if ( ! unit || ! unit.length ) {
		return numberFormat( number, options );
	}

	if ( unit === '%' ) {
		return numberFormat( number / 100, {
			maximumFractionDigits: 2,
			style: 'percent',
			...options,
		} );
	}

	try {
		return numberFormat( Math.abs( number ), { style: 'currency', currency: unit, ...options } );
	} catch ( e ) {
		return `${ numberFormat( Math.abs( number ) ) }${ unit }`;
	}
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
