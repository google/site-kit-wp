/**
 * Utility functions.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import {
	map,
	isEqual,
	isFinite,
	get,
	unescape,
} from 'lodash';
import React from 'react';

/**
 * WordPress dependencies
 */
import {
	addFilter,
} from '@wordpress/hooks';
import {
	__,
	sprintf,
} from '@wordpress/i18n';
import { addQueryArgs, getQueryString } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SvgIcon from './svg-icon';
import { trackEvent } from './tracking';
import data, { TYPE_CORE } from '../components/data';
import { fillFilterWithComponent } from './helpers';
export { trackEvent };
export * from './sanitize';
export * from './stringify';
export * from './standalone';
export * from './storage';
export * from './i18n';
//export * from './date-range';
export * from './helpers';

/**
 * Remove a parameter from a URL string.
 *
 * Fallback for when URL is unable to handle parsedURL.searchParams.delete.
 *
 * @param {string} url       The URL to process.
 * @param {string} parameter The URL parameter to remove.
 *
 * @return {string} URL without the deleted parameter.
 *
 */
const removeURLFallBack = ( url, parameter ) => {
	const urlparts = url.split( '?' );
	if ( 2 <= urlparts.length ) {
		const prefix = encodeURIComponent( parameter ) + '=';
		const pars = urlparts[ 1 ].split( /[&;]/g );

		//reverse iteration as may be destructive
		const newPars = pars.filter( ( param ) => {
			return -1 === param.lastIndexOf( prefix, 0 );
		} );

		url = urlparts[ 0 ] + '/' + ( 0 < newPars.length ? '?' + newPars.join( '&' ) : '' );
		return url;
	}
	return url;
};

/**
 * Remove a parameter from a URL string.
 *
 * Leverages the URL object internally.
 *
 * @param {string} url       The URL to process.
 * @param {string} parameter The URL parameter to remove.
 *
 * @return {string} URL without the deleted parameter.
 */
export const removeURLParameter = ( url, parameter ) => {
	const parsedURL = new URL( url );

	// If the URL implementation doesn't support ! parsedURL.searchParams, use the fallback handler.
	if ( ! parsedURL.searchParams || ! parsedURL.searchParams.delete ) {
		return removeURLFallBack( url, parameter );
	}
	parsedURL.searchParams.delete( parameter );
	return parsedURL.href;
};

/**
 * Prepares a number to be used in readableLargeNumber.
 *
 * @param {number} number The large number to prepare.
 *
 * @return {number} The prepared number
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
 * Format a large number for shortened display.
 *
 * @param {number}           number       The large number to format.
 * @param {(string|boolean)} currencyCode Optional currency code to format as amount.
 *
 * @return {string} The formatted number.
 */
export const readableLargeNumber = ( number, currencyCode = false ) => {
	// Cast parseable values to numeric types.
	number = isFinite( number ) ? number : Number( number );

	if ( ! isFinite( number ) ) {
		// eslint-disable-next-line no-console
		console.warn( 'Invalid number', number, typeof number );
		number = 0;
	}

	if ( currencyCode ) {
		return numberFormat( number, { style: 'currency', currency: currencyCode } );
	}

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

	return number.toString();
};

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

/**
 * Transform a period string into a number of seconds.
 *
 * @param {string} period The period to transform.
 *
 * @return {number} The number of seconds
 */
export const getTimeInSeconds = ( period ) => {
	const minute = 60;
	const hour = minute * 60;
	const day = hour * 24;
	const week = day * 7;
	const month = day * 30;
	const year = day * 365;
	switch ( period ) {
		case 'minute':
			return minute;

		case 'hour':
			return hour;

		case 'day':
			return day;

		case 'week':
			return week;

		case 'month':
			return month;

		case 'year':
			return year;
	}
};

/**
 * Converts seconds to a display ready string indicating
 * the number of hours, minutes and seconds that have elapsed.
 *
 * For example, passing 65 returns '1m 5s'.
 *
 * @param {number} seconds The number of seconds.
 *
 * @return {string} Human readable string indicating time elapsed.
 *
 */
export const prepareSecondsForDisplay = ( seconds ) => {
	seconds = parseInt( seconds, 10 );

	if ( isNaN( seconds ) || 0 === seconds ) {
		return '0.0s';
	}
	const results = {};
	results.hours = Math.floor( seconds / 60 / 60 );
	results.minutes = Math.floor( ( seconds / 60 ) % 60 );
	results.seconds = Math.floor( seconds % 60 );

	const returnString =
		( results.hours ? results.hours + 'h ' : '' ) +
		( results.minutes ? results.minutes + 'm ' : '' ) +
		( results.seconds ? results.seconds + 's ' : '' );

	return returnString.trim();
};

/**
 * Retrieve number of days between 2 dates.
 *
 * @param {Date} dateStart Start date instance.
 * @param {Date} dateEnd   End date instance.
 *
 * @return {number} The number of days.
 */
export const getDaysBetweenDates = ( dateStart, dateEnd ) => {
	const dayMs = 1000 * getTimeInSeconds( 'day' );
	const dateStartMs = dateStart.getTime();
	const dateEndMs = dateEnd.getTime();

	return Math.round( Math.abs( dateStartMs - dateEndMs ) / dayMs );
};

/**
 * Calculate the percent change between two values.
 *
 * @param {number} previous The previous value.
 * @param {number} current  The current value.
 *
 * @return {(number|string)} The percent change.
 */
export const changeToPercent = ( previous, current ) => {
	// Prevent divide by zero errors.
	if ( '0' === previous || 0 === previous || isNaN( previous ) ) {
		return '';
	}
	const change = ( ( current - previous ) / previous * 100 ).toFixed( 1 );

	// Avoid NaN at all costs.
	if ( isNaN( change ) || 'Infinity' === change ) {
		return '';
	}

	return change;
};

/**
 * Extract a single column of data for a sparkline from a dataset prepared for Google charts.
 *
 * @param {Array}  rowData   An array of Google charts row data.
 * @param {number} column The column to extract for the sparkline.
 *
 * @return {Array} Extracted column of dataset prepared for Google charts.
 *
 */
export const extractForSparkline = ( rowData, column ) => {
	return map( rowData, ( row, i ) => {
		return [
			row[ 0 ], // row[0] always contains the x axis value (typically date).
			row[ column ] || ( 0 === i ? '' : 0 ), // the data for the sparkline.
		];
	} );
};

export const refreshAuthentication = async () => {
	try {
		const response = await data.get( TYPE_CORE, 'user', 'authentication' );

		const requiredAndGrantedScopes = response.grantedScopes.filter( ( scope ) => {
			return -1 !== response.requiredScopes.indexOf( scope );
		} );

		// We should really be using state management. This is terrible.
		global.googlesitekit.setup = global.googlesitekit.setup || {};
		global.googlesitekit.setup.isAuthenticated = response.isAuthenticated;
		global.googlesitekit.setup.requiredScopes = response.requiredScopes;
		global.googlesitekit.setup.grantedScopes = response.grantedScopes;
		global.googlesitekit.setup.needReauthenticate = requiredAndGrantedScopes.length < response.requiredScopes.length;
	} catch ( e ) { // eslint-disable-line no-empty
	}
};

/**
 * Gets data for all modules.
 *
 * Because googlesitekit.modules contains both module information (legacy) and
 * API functions (new), we should be using this function and never access
 * googlesitekit.modules directly to access module data.
 *
 * This function should be removed once this object is no longer used to store
 * legacy module data.
 *
 * @since 1.7.0
 *
 * @param {Object}  _googlesitekit Optional. googlesitekit global; can be replaced for testing.
 * @return {Object} Object with module data, with each module keyed by its slug.
 */
export const getModulesData = ( _googlesitekit = global.googlesitekit ) => {
	const modulesObj = _googlesitekit.modules;
	if ( ! modulesObj ) {
		return {};
	}

	return Object.keys( modulesObj ).reduce( ( acc, slug ) => {
		if ( 'object' !== typeof modulesObj[ slug ] ) {
			return acc;
		}
		if (
			'undefined' === typeof modulesObj[ slug ].slug ||
			'undefined' === typeof modulesObj[ slug ].name ||
			modulesObj[ slug ].slug !== slug
		) {
			return acc;
		}
		return { ...acc, [ slug ]: modulesObj[ slug ] };
	}, {} );
};

/**
 * Get the URL needed to initiate a reAuth flow.
 *
 * @param {string}  slug   The module slug. If included redirect URL will include page: page={ `googlesitekit-${slug}`}.
 * @param {boolean} status The module activation status.
 * @param {Object}  _googlesitekit googlesitekit global; can be replaced for testing.
 * @return {string} Authentication URL
 */
export const getReAuthURL = ( slug, status, _googlesitekit = global.googlesitekit ) => {
	const {
		connectURL,
		adminRoot,
	} = _googlesitekit.admin;

	const { needReauthenticate } = _googlesitekit.setup;

	const { screenID } = getModulesData( _googlesitekit )[ slug ];

	// Special case handling for PageSpeed Insights.
	// TODO: Refactor this out.
	const pageSpeedQueryArgs = 'pagespeed-insights' === slug ? {
		notification: 'authentication_success',
		reAuth: undefined,
	} : {};

	let redirect = addQueryArgs(
		adminRoot, {
			// If the module has a submenu page, and is being activated, redirect back to the module page.
			page: ( slug && status && screenID ) ? screenID : 'googlesitekit-dashboard',
			slug,
			reAuth: status,
			...pageSpeedQueryArgs,
		}
	);

	if ( ! needReauthenticate ) {
		return redirect;
	}

	// Encodes the query string to ensure the redirect url is not messing up with the main url.
	const queryString = encodeURIComponent( getQueryString( redirect ) );

	// Rebuild the redirect url.
	redirect = adminRoot + '?' + queryString;

	return addQueryArgs(
		connectURL, {
			redirect,
			status,
		}
	);
};

/**
 * Get Site Kit Admin URL Helper
 *
 * @param {string} page The page slug. Optional. Default is 'googlesitekit-dashboard'.
 * @param {Object} args Optional. Object of arguments to add to the URL.
 *
 * @return {string} Admin URL with appended query params.
 */
export const getSiteKitAdminURL = ( page, args ) => {
	const { adminRoot } = global.googlesitekit.admin;

	if ( ! page ) {
		page = 'googlesitekit-dashboard';
	}

	args = { page, ...args };
	return addQueryArgs( adminRoot, args );
};

/**
 * Verifies whether JSON is valid.
 *
 * @param {string} stringToValidate The string to validate.
 *
 * @return {boolean} Indicates JSON is valid.
 */
export const validateJSON = ( stringToValidate ) => {
	try {
		return ( JSON.parse( stringToValidate ) && !! stringToValidate );
	} catch ( e ) {
		return false;
	}
};

/**
 * Verifies Optimize ID
 *
 * @param {string} stringToValidate The string to validate.
 *
 * @return {boolean} Indicates GTM tag is valid.
 */
export const validateOptimizeID = ( stringToValidate ) => {
	return ( stringToValidate.match( /^GTM-[a-zA-Z\d]{7}$/ ) );
};

/**
 * Activate or Deactivate a Module.
 *
 * @param {Object}  restApiClient Rest API client from data module, this needed so we don't need to import data module in helper.
 * @param {string}  moduleSlug    Module slug to activate or deactivate.
 * @param {boolean} status        True if module should be activated, false if it should be deactivated.
 * @return {Promise} A promise for activating/deactivating a module.
 */
export const activateOrDeactivateModule = ( restApiClient, moduleSlug, status ) => {
	return restApiClient.setModuleActive( moduleSlug, status ).then( ( responseData ) => {
		const modulesData = getModulesData();

		// We should really be using state management. This is terrible.
		if ( modulesData[ moduleSlug ] ) {
			modulesData[ moduleSlug ].active = responseData.active;
		}

		trackEvent(
			`${ moduleSlug }_setup`,
			! responseData.active ? 'module_deactivate' : 'module_activate',
			moduleSlug,
		);

		return new Promise( ( resolve ) => {
			resolve( responseData );
		} );
	} );
};

/**
 * Helper to toggle confirm changes button disable/enable
 * depending on the module changed settings.
 *
 * @param {string} moduleSlug      The module slug being edited.
 * @param {Object} settingsMapping The mapping between form settings names and saved settings.
 * @param {Object} settingsState   The changed settings component state to compare with.
 * @param {Object} skipDOM         Skip DOm checks/modifications, used for testing.
 * @param {Object}  _googlesitekit googlesitekit global; can be replaced for testing.
 * @return {(void|boolean)} True if a module has been toggled.
 */
export const toggleConfirmModuleSettings = ( moduleSlug, settingsMapping, settingsState, skipDOM = false, _googlesitekit = global.googlesitekit ) => {
	const { settings, setupComplete } = getModulesData( _googlesitekit )[ moduleSlug ];
	const confirm = skipDOM || document.getElementById( `confirm-changes-${ moduleSlug }` );

	if ( ! setupComplete || ! confirm ) {
		return;
	}

	// Check if any of the mapped settings differ from the current/saved settings.
	const changed = !! Object.keys( settingsMapping ).find( ( stateKey ) => {
		const settingsKey = settingsMapping[ stateKey ];
		return ! isEqual( settingsState[ stateKey ], settings[ settingsKey ] );
	} );

	if ( ! skipDOM ) {
		confirm.disabled = ! changed;
	}

	return changed;
};

/**
 * Trigger error notification on top of the page.
 *
 * @param {WPElement} ErrorComponent The error component to render in place.
 * @param {Object}    props          The props to pass down to the error component. Optional.
 */
export const showErrorNotification = ( ErrorComponent, props = {} ) => {
	addFilter( 'googlesitekit.ErrorNotification',
		'googlesitekit.ErrorNotification',
		fillFilterWithComponent( ErrorComponent, props ), 1 );
};

/**
 * HTML text into HTML entity.
 *
 * _.unescape doesn't seem to decode some entities for admin bar titles.
 * adding combination in this helper as a workaround.
 *
 * @param {string} str The string to decode.
 *
 * @return {string} Decoded HTML entity.
 */
export const decodeHtmlEntity = ( str ) => {
	if ( ! str ) {
		return '';
	}

	const decoded = str.replace( /&#(\d+);/g, function( match, dec ) {
		return String.fromCharCode( dec );
	} ).replace( /(\\)/g, '' );

	return unescape( decoded );
};

/**
 * Get the icon for a module.
 *
 * @param {string}  module                The module slug.
 * @param {boolean} blockedByParentModule Whether the module is blocked by a parent module.
 * @param {string}  width                 The icon width.
 * @param {string}  height                The icon height.
 * @param {string}  useClass              Class string to use for icon.
 *
 * @return {HTMLImageElement}             <img> tag with module icon.
 */
export function moduleIcon( module, blockedByParentModule, width = '33', height = '33', useClass = '' ) {
	if ( ! global.googlesitekit ) {
		return;
	}

	/* Set module icons. Page Speed Insights is a special case because only a .png is available. */
	let iconComponent = <SvgIcon id={ module } width={ width } height={ height } className={ useClass } />;

	if ( blockedByParentModule ) {
		iconComponent = <SvgIcon id={ `${ module }-disabled` } width={ width } height={ height } className={ useClass } />;
	} else if ( 'pagespeed-insights' === module ) {
		iconComponent = <img src={ global.googlesitekit.admin.assetsRoot + 'images/icon-pagespeed.png' } width={ width } alt="" className={ useClass } />;
	}

	return iconComponent;
}

/**
 * Gets the meta key for the given user option.
 *
 * @param {string} userOptionName User option name.
 * @param {Object} _googlesitekitBaseData Site Kit base data (used for testing).
 * @return {string} meta key name.
 */
export function getMetaKeyForUserOption( userOptionName, _googlesitekitBaseData = global._googlesitekitBaseData ) {
	const { blogPrefix, isNetworkMode } = _googlesitekitBaseData;

	if ( ! isNetworkMode ) {
		return blogPrefix + userOptionName;
	}

	return userOptionName;
}
