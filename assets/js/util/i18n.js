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
 * WordPress dependencies
 */
import { setLocaleData } from '@wordpress/i18n';

/**
 * Loads the translations for the google-site-kit text domain.
 */
export function loadTranslations() {
	setLocaleData( global.googlesitekit.locale, 'google-site-kit' );
}

/**
 * Internationalization Number Format.
 *
 * @param {number} number The number to format.
 * @param {Object} [options] Formatting options.
 * @param {string} [options.locale] Locale to use for formatting. Defaults to current locale used by Site Kit.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NumberFormat/NumberFormat|`options` parameter}
 *      For all available formatting options.
 *
 * @return {string} The formatted number.
 */
export const numberFormat = ( number, options = {} ) => {
	const { locale = getLocale(), ...formatOptions } = options;

	return new Intl.NumberFormat( locale, formatOptions ).format( number );
};

/**
 * Gets the current locale for use with browser APIs.
 *
 * @param {Object} _global The global window object.
 *
 * @return {string} Current Site Kit locale if set, otherwise the current language set by the browser.
 *                  E.g. `en-US` or `de-DE`
 */
export const getLocale = ( _global = global ) => {
	const siteKitLocale = get( _global, [ 'googlesitekit', 'locale', '', 'lang' ] );
	if ( siteKitLocale ) {
		const matches = siteKitLocale.match( /^(\w{2})?(_)?(\w{2})/ );
		if ( matches && matches[ 0 ] ) {
			return matches[ 0 ].replace( /_/g, '-' );
		}
	}

	return _global.navigator.language;
};
