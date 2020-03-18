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
import data, { TYPE_CORE } from 'GoogleComponents/data';
import SvgIcon from 'GoogleUtil/svg-icon';
import React from 'react';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	addFilter,
	applyFilters,
} from '@wordpress/hooks';
import {
	_n,
	__,
	sprintf,
} from '@wordpress/i18n';
import { addQueryArgs, getQueryString } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { tagMatchers as setupTagMatchers } from '../components/setup/compatibility-checks';
import { default as adsenseTagMatchers } from '../modules/adsense/util/tagMatchers';
import { default as analyticsTagMatchers } from '../modules/analytics/util/tagMatchers';
import { tagMatchers as tagmanagerTagMatchers } from '../modules/tagmanager/util';
import { trackEvent } from './tracking';
export { trackEvent };
export * from './sanitize';
export * from './standalone';
export * from './storage';
export * from './i18n';

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

	switch ( true ) {
		case 1000000 < number :
			return sprintf(
				// translators: %s: an abbreviated number in millions.
				__( '%sM', 'google-site-kit' ),
				numberFormat( number / 1000000, withSingleDecimal )
			);
		case 99000 < number :
			return sprintf(
				// translators: %s: an abbreviated number in thousands.
				__( '%sK', 'google-site-kit' ),
				numberFormat( Math.round( number / 1000 ) )
			);
		case 1000 < number :
			return sprintf(
				// translators: %s: an abbreviated number in thousands.
				__( '%sK', 'google-site-kit' ),
				numberFormat( number / 1000, withSingleDecimal )
			);
		default:
			return number.toString();
	}
};

/**
 * Internationalization Number Format.
 *
 * @param {number} number The number to format.
 * @param {Object} [options] Formatting options.
 * @param {string} [locale] Locale tag. Optional.
 *
 * @return {string} The formatted number.
 */
export const numberFormat = ( number, options = {}, locale = getLocale() ) => {
	return new Intl.NumberFormat( locale, options ).format( number );
};

/**
 * Gets the current locale for use with browser APIs.
 *
 * @return {string} Current Site Kit locale if set, otherwise the current language set by the browser.
 *                  E.g. `en-US` or `de-DE`
 */
export const getLocale = () => {
	const siteKitLocale = get( global, [ 'googlesitekit', 'locale', '', 'lang' ] );

	if ( siteKitLocale ) {
		return siteKitLocale.replace( '_', '-' );
	}

	return global.navigator.language;
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

	const { screenID } = _googlesitekit.modules[ slug ];

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
 * Replace a filtered component with the passed component and merge their props.
 *
 * Components wrapped in the 'withFilters' higher order component have a filter applied to them (wp.hooks.applyFilters).
 * This helper is used to replace (or "Fill") a filtered component with a passed component. To use, pass as the third
 * argument to an addFilter call, eg:
 *
 * 	addFilter( `googlesitekit.ModuleSettingsDetails-${slug}`,
 * 		'googlesitekit.AdSenseModuleSettingsDetails',
 * 		fillFilterWithComponent( AdSenseSettings, {
 * 			onSettingsPage: true,
 * 		} ) );
 *
 * @param {WPElement} NewComponent The component to render in place of the filtered component.
 * @param {Object}    newProps     The props to pass down to the new component.
 *
 * @return {WPElement} React Component after overriding filtered component with NewComponent.
 */
export const fillFilterWithComponent = ( NewComponent, newProps ) => {
	return ( OriginalComponent ) => {
		return function InnerComponent( props ) {
			return (
				<NewComponent { ...props } { ...newProps } OriginalComponent={ OriginalComponent } />
			);
		};
	};
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
 * Looks for existing tag requesting front end html, if no existing tag was found on server side
 * while requesting list of accounts.
 *
 * @param {string} module Module slug.
 *
 * @return {(string|null)} The tag id if found, otherwise null.
 */
export const getExistingTag = async ( module ) => {
	const { homeURL, ampMode } = global.googlesitekit.admin;
	const tagFetchQueryArgs = {
		// Indicates a tag checking request. This lets Site Kit know not to output its own tags.
		tagverify: 1,
		// Add a timestamp for cache-busting.
		timestamp: Date.now(),
	};

	// Always check the homepage regardless of AMP mode.
	let tagFound = await scrapeTag( addQueryArgs( homeURL, tagFetchQueryArgs ), module );

	if ( ! tagFound && 'secondary' === ampMode ) {
		tagFound = await apiFetch( { path: '/wp/v2/posts?per_page=1' } ).then(
			// Scrape the first post in AMP mode, if there is one.
			( posts ) => posts.slice( 0, 1 ).map( async ( post ) => {
				return await scrapeTag( addQueryArgs( post.link, { ...tagFetchQueryArgs, amp: 1 } ), module );
			} ).pop()
		);
	}

	return Promise.resolve( tagFound || null );
};

/**
 * Scrapes a module tag from the given URL.
 *
 * @param {string} url URL request and parse tag from.
 * @param {string} module The module to parse tag for.
 *
 * @return {(string|null)} The tag id if found, otherwise null.
 */
export const scrapeTag = async ( url, module ) => {
	try {
		const html = await fetch( url, { credentials: 'omit' } ).then( ( res ) => res.text() );
		return extractTag( html, module ) || null;
	} catch ( error ) {
		return null;
	}
};

/**
 * Extracts a tag related to a module from the given string.
 *
 * @param {string} string The string from where to find the tag.
 * @param {string} module The tag to search for, one of 'adsense' or 'analytics'
 *
 * @return {(string|boolean)} The tag id if found, otherwise false.
 */
export const extractTag = ( string, module ) => {
	const matchers = {
		adsense: adsenseTagMatchers,
		analytics: analyticsTagMatchers,
		tagmanager: tagmanagerTagMatchers,
		setup: setupTagMatchers,
	}[ module ] || [];

	const matchingPattern = matchers.find( ( pattern ) => pattern.test( string ) );

	if ( matchingPattern ) {
		return matchingPattern.exec( string )[ 1 ];
	}

	return false;
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
		// We should really be using state management. This is terrible.
		if ( global.googlesitekit.modules && global.googlesitekit.modules[ moduleSlug ] ) {
			global.googlesitekit.modules[ moduleSlug ].active = responseData.active;
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
	const { settings, setupComplete } = _googlesitekit.modules[ moduleSlug ];
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
 * Gets the current dateRange string.
 *
 * @return {string} the date range string.
 */
export function getCurrentDateRange() {
	/**
	 * Filter the date range used for queries.
	 *
	 * @param String The selected date range. Default 'Last 28 days'.
	 */
	const dateRange = applyFilters( 'googlesitekit.dateRange', 'last-28-days' );
	const daysMatch = dateRange.match( /last-(\d+)-days/ );

	if ( daysMatch && daysMatch[ 1 ] ) {
		return sprintf(
			_n( '%s day', '%s days', parseInt( daysMatch[ 1 ], 10 ), 'google-site-kit' ),
			daysMatch[ 1 ]
		);
	}

	throw new Error( 'Unrecognized date range slug used in `googlesitekit.dateRange`.' );
}

/**
 * Gets the current dateRange slug.
 *
 * @return {string} the date range slug.
 */
export function getCurrentDateRangeSlug() {
	return applyFilters( 'googlesitekit.dateRange', 'last-28-days' );
}

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
 * Sorts an object by its keys.
 *
 * The returned value will be a sorted copy of the input object.
 * Any inner objects will also be sorted recursively.
 *
 * @param {Object} obj The data object to sort.
 * @return {Object} The sorted data object.
 */
export function sortObjectProperties( obj ) {
	const orderedData = {};
	Object.keys( obj ).sort().forEach( ( key ) => {
		let val = obj[ key ];
		if ( val && 'object' === typeof val && ! Array.isArray( val ) ) {
			val = sortObjectProperties( val );
		}
		orderedData[ key ] = val;
	} );
	return orderedData;
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
