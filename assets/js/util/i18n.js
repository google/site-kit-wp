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
import { __ } from '@wordpress/i18n';

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
 * Flattens an array using the JS Internationalization List Format API with a fallback if it is unavailable.
 *
 * @since n.e.x.t
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
export const listFlatten = ( list, options = {} ) => {
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
