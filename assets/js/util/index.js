/**
 * Utility functions.
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
import {
	isFinite,
	get,
	unescape,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { trackEvent } from './tracking';
import { fillFilterWithComponent } from './helpers';
export { trackEvent };
export * from './sanitize';
export * from './stringify';
export * from './standalone';
export * from './storage';
export * from './i18n';
export * from './helpers';
export * from './markdown';
export * from './convert-time';
export * from './date-range';
export * from './chart';

/**
 * Removes a parameter from a URL string.
 *
 * Fallback for when URL is unable to handle parsedURL.searchParams.delete.
 *
 * @since 1.0.0
 *
 * @param {string} url       The URL to process.
 * @param {string} parameter The URL parameter to remove.
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
 * Removes a parameter from a URL string.
 *
 * Leverages the URL object internally.
 *
 * @since 1.0.0
 *
 * @param {string} url       The URL to process.
 * @param {string} parameter The URL parameter to remove.
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
 * Gets the current locale for use with browser APIs.
 *
 * @since 1.6.0
 *
 * @param {Object} _global The global window object.
 * @return {string} Current Site Kit locale if set, otherwise the current language set by the browser.
 *                  E.g. `en-US` or `de-DE`
 */
export const getLocale = ( _global = global ) => {
	const siteKitLocale = get( _global, [ '_googlesitekitLegacyData', 'locale', '', 'lang' ] );
	if ( siteKitLocale ) {
		const matches = siteKitLocale.match( /^(\w{2})?(_)?(\w{2})/ );
		if ( matches && matches[ 0 ] ) {
			return matches[ 0 ].replace( /_/g, '-' );
		}
	}

	return _global.navigator.language;
};

/**
 * Transforms a period string into a number of seconds.
 *
 * @since 1.0.0
 *
 * @param {string} period The period to transform.
 * @return {number} The number of seconds.
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
 * Retrieves the number of days between 2 dates.
 *
 * @since 1.0.0
 *
 * @param {Date} dateStart Start date instance.
 * @param {Date} dateEnd   End date instance.
 * @return {number} The number of days.
 */
export const getDaysBetweenDates = ( dateStart, dateEnd ) => {
	const dayMs = 1000 * getTimeInSeconds( 'day' );
	const dateStartMs = dateStart.getTime();
	const dateEndMs = dateEnd.getTime();

	return Math.round( Math.abs( dateStartMs - dateEndMs ) / dayMs );
};

/**
 * Calculates the change between two values.
 *
 * @since 1.24.0
 *
 * @param {number} previous The previous value.
 * @param {number} current  The current value.
 * @return {(number|null)} The percent change. Null if the input or output is invalid.
 */
export const calculateChange = ( previous, current ) => {
	// Prevent divide by zero errors.
	if ( '0' === previous || 0 === previous || isNaN( previous ) ) {
		return null;
	}

	const change = ( current - previous ) / previous;

	// Avoid NaN at all costs.
	if ( isNaN( change ) || ! isFinite( change ) ) {
		return null;
	}

	return change;
};

/**
 * Gets data for all modules.
 *
 * Because _googlesitekitLegacyData.modules contains both module information (legacy) and
 * API functions (new), we should be using this function and never access
 * _googlesitekitLegacyData.modules directly to access module data.
 *
 * This function should be removed once this object is no longer used to store
 * legacy module data.
 *
 * @since 1.7.0
 *
 * @param {Object} __googlesitekitLegacyData Optional. _googlesitekitLegacyData global; can be replaced for testing.
 * @return {Object} Object with module data, with each module keyed by its slug.
 */
export const getModulesData = ( __googlesitekitLegacyData = global._googlesitekitLegacyData ) => {
	const modulesObj = __googlesitekitLegacyData.modules;
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
 * Gets Site Kit Admin URL Helper.
 *
 * @since 1.0.0
 *
 * @param {string} page The page slug. Optional. Default is 'googlesitekit-dashboard'.
 * @param {Object} args Optional. Object of arguments to add to the URL.
 * @return {string} Admin URL with appended query params.
 */
export const getSiteKitAdminURL = ( page, args ) => {
	const { adminRoot } = global._googlesitekitLegacyData.admin;

	if ( ! page ) {
		page = 'googlesitekit-dashboard';
	}

	args = { page, ...args };
	return addQueryArgs( adminRoot, args );
};

/**
 * Verifies whether JSON is valid.
 *
 * @since 1.0.0
 *
 * @param {string} stringToValidate The string to validate.
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
 * Verifies Optimize ID.
 *
 * @since 1.0.0
 *
 * @param {string} stringToValidate The string to validate.
 * @return {boolean} Indicates GTM or OPT tag is valid.
 */
export const validateOptimizeID = ( stringToValidate ) => {
	return ( stringToValidate.match( /^(GTM|OPT)-[a-zA-Z\d]{7}$/ ) );
};

/**
 * Triggers an error notification on top of the page.
 *
 * @since 1.0.0
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
 * Converts HTML text into an HTML entity.
 *
 * _.unescape doesn't seem to decode some entities for admin bar titles.
 * adding combination in this helper as a workaround.
 *
 * @since 1.0.0
 *
 * @param {string} str The string to decode.
 * @return {string} Decoded HTML entity.
 */
export const decodeHTMLEntity = ( str ) => {
	if ( ! str ) {
		return '';
	}

	const decoded = str.replace( /&#(\d+);/g, function( match, dec ) {
		return String.fromCharCode( dec );
	} ).replace( /(\\)/g, '' );

	return unescape( decoded );
};
