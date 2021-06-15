/**
 * `core/site` data store: site info.
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
import invariant from 'invariant';
import queryString from 'query-string';

/**
 * WordPress dependencies
 */
import { addQueryArgs, getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME, AMP_MODE_PRIMARY, AMP_MODE_SECONDARY } from './constants';
import { getLocale, normalizeURL, untrailingslashit } from '../../../util';

const { createRegistrySelector } = Data;

function getSiteInfoProperty( propName ) {
	return createRegistrySelector( ( select ) => () => {
		const siteInfo = select( STORE_NAME ).getSiteInfo() || {};
		return siteInfo[ propName ];
	} );
}

// Actions
const RECEIVE_SITE_INFO = 'RECEIVE_SITE_INFO';
const RECEIVE_PERMALINK_PARAM = 'RECEIVE_PERMALINK_PARAM';

export const initialState = {
	siteInfo: undefined,
	permaLink: false,
};

export const actions = {
	/**
	 * Stores site info in the datastore.
	 *
	 * Because this is frequently-accessed data, this is usually sourced
	 * from a global variable (`_googlesitekitSiteData`), set by PHP
	 * in the `before_print` callback for `googlesitekit-datastore-site`.
	 *
	 * @since 1.7.0
	 * @private
	 *
	 * @param {Object} siteInfo Site info, usually supplied via a global variable from PHP.
	 * @return {Object} Redux-style action.
	 */
	receiveSiteInfo( siteInfo ) {
		invariant( siteInfo, 'siteInfo is required.' );

		return {
			payload: { siteInfo },
			type: RECEIVE_SITE_INFO,
		};
	},

	receivePermaLinkParam( permaLink ) {
		invariant( permaLink, 'permaLink is required.' );

		return {
			payload: { permaLink },
			type: RECEIVE_PERMALINK_PARAM,
		};
	},
};

export const controls = {};

export const reducer = ( state, { payload, type } ) => {
	switch ( type ) {
		case RECEIVE_SITE_INFO: {
			const {
				adminURL,
				ampMode,
				currentEntityID,
				currentEntityTitle,
				currentEntityType,
				currentEntityURL,
				homeURL,
				proxyPermissionsURL,
				proxySetupURL,
				referenceSiteURL,
				siteName,
				timezone,
				usingProxy,
				webStoriesActive,
			} = payload.siteInfo;

			return {
				...state,
				siteInfo: {
					adminURL,
					ampMode,
					currentEntityID: parseInt( currentEntityID, 10 ),
					currentEntityTitle,
					currentEntityType,
					currentEntityURL,
					homeURL,
					proxyPermissionsURL,
					proxySetupURL,
					referenceSiteURL,
					siteName,
					timezone,
					usingProxy,
					webStoriesActive,
				},
			};
		}

		case RECEIVE_PERMALINK_PARAM:
			const { permaLink } = payload;
			return {
				...state,
				permaLink,
			};

		default: {
			return state;
		}
	}
};

export const resolvers = {
	*getSiteInfo() {
		const registry = yield Data.commonActions.getRegistry();

		if ( registry.select( STORE_NAME ).getSiteInfo() ) {
			return;
		}

		if ( ! global._googlesitekitBaseData || ! global._googlesitekitEntityData ) {
			global.console.error( 'Could not load core/site info.' );
			return;
		}

		const {
			adminURL,
			ampMode,
			homeURL,
			proxyPermissionsURL,
			proxySetupURL,
			referenceSiteURL,
			siteName,
			timezone,
			usingProxy,
			webStoriesActive,
		} = global._googlesitekitBaseData;
		const {
			currentEntityID,
			currentEntityTitle,
			currentEntityType,
			currentEntityURL,
		} = global._googlesitekitEntityData;

		yield actions.receiveSiteInfo( {
			adminURL,
			ampMode,
			currentEntityID,
			currentEntityTitle,
			currentEntityType,
			currentEntityURL,
			homeURL,
			proxyPermissionsURL,
			proxySetupURL,
			referenceSiteURL,
			siteName,
			timezone,
			usingProxy: !! usingProxy,
			webStoriesActive,
		} );
	},
};

export const selectors = {
	/**
	 * Gets all site info from this data store.
	 *
	 * Not intended to be used publicly; this is largely here so other selectors can
	 * request data using the selector/resolver pattern.
	 *
	 * @since 1.7.0
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Site connection info.
	 */
	getSiteInfo( state ) {
		return state.siteInfo;
	},

	/**
	 * Gets a site's admin URL.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object}             state Data store's state.
	 * @param {(string|undefined)} page  Optional page query argument ( Simple format: 'test-page' or Full format: 'custom.php?page=test-page' ) to add to admin URL. If not provided, the base admin URL is returned.
	 * @param {(Object|undefined)} args  Optional additional query arguments to add to admin URL.
	 * @return {(string|undefined)} This site's admin URL.
	 */
	getAdminURL: createRegistrySelector( ( select ) => ( state, page, args = {} ) => {
		const { adminURL } = select( STORE_NAME ).getSiteInfo() || {};

		// Return adminURL if undefined, or if no page supplied.
		if ( adminURL === undefined || page === undefined ) {
			return adminURL;
		}

		const baseURL = ( adminURL[ adminURL.length - 1 ] === '/' ) ? adminURL : `${ adminURL }/`;
		let pageArg = page;
		let phpFile = 'admin.php';

		// If page argument is full format (i.e. 'admin.php?page=google-site-kit'), extract php file and pageArg, returning early with adminURL if no 'page' param found.
		if ( page.indexOf( '.php?' ) !== -1 ) {
			const splitPage = page.split( '?' );
			pageArg = queryString.parse( splitPage.pop() ).page;

			if ( ! pageArg ) {
				return adminURL;
			}

			phpFile = splitPage.shift();
		}

		// Since page should be first query arg, create queryArgs without 'page' to prevent a 'page' in args from overriding it.
		const { page: extraPage, ...queryArgs } = args; // eslint-disable-line no-unused-vars

		return addQueryArgs(
			`${ baseURL }${ phpFile }`,
			{
				page: pageArg,
				...queryArgs,
			}
		);
	} ),

	/**
	 * Gets a site's AMP mode.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} AMP Mode.
	 */
	getAMPMode: getSiteInfoProperty( 'ampMode' ),

	/**
	 * Gets the current entity's ID.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(number|null|undefined)} Current entity's ID, null if there is
	 *                                   none, undefined if not loaded yet.
	 */
	getCurrentEntityID: getSiteInfoProperty( 'currentEntityID' ),

	/**
	 * Gets the current entity's title.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} Current entity's title, null if there
	 *                                   is none, undefined if not loaded yet.
	 */
	getCurrentEntityTitle: getSiteInfoProperty( 'currentEntityTitle' ),

	/**
	 * Gets the current entity's title.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} Current entity's type, null if there
	 *                                   is none, undefined if not loaded yet.
	 */
	getCurrentEntityType: getSiteInfoProperty( 'currentEntityType' ),

	/**
	 * Gets the current entity's reference URL.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} Current entity's URL, null if there is
	 *                                   none, undefined if not loaded yet.
	 */
	getCurrentEntityURL: getSiteInfoProperty( 'currentEntityURL' ),

	/**
	 * Gets a site's homepage URL.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} This site's home URL.
	 */
	getHomeURL: getSiteInfoProperty( 'homeURL' ),

	/**
	 * Gets a site's reference site URL.
	 *
	 * @since 1.7.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The reference site URL.
	 */
	getReferenceSiteURL: getSiteInfoProperty( 'referenceSiteURL' ),

	/**
	 * Gets proxy setup URL.
	 *
	 * @since 1.14.0
	 *
	 * @return {string} Proxy setup URL if available, otherwise an empty string.
	 */
	getProxySetupURL: getSiteInfoProperty( 'proxySetupURL' ),

	/**
	 * Gets proxy permissions URL.
	 *
	 * @since 1.14.0
	 *
	 * @return {string} Proxy permissions URL if available, otherwise an empty string.
	 */
	getProxyPermissionsURL: getSiteInfoProperty( 'proxyPermissionsURL' ),

	/**
	 * Gets the current reference URL to use.
	 *
	 * This selector should be used to get the contextual URL for requesting
	 * URL-specific data from Google APIs.
	 *
	 * If a current entity exists, this will return the same value as the
	 * `getCurrentEntityURL` selector. Otherwise it will fall back to returning
	 * the same value as the `getReferenceSiteURL` selector.
	 *
	 * @since 1.10.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The current reference URL, or undefined if
	 *                              not loaded yet.
	 */
	getCurrentReferenceURL: createRegistrySelector( ( select ) => () => {
		// Use current entity URL if present or still loading.
		const currentEntityURL = select( STORE_NAME ).getCurrentEntityURL();
		if ( currentEntityURL !== null ) {
			return currentEntityURL;
		}

		// Otherwise fall back to reference site URL.
		return select( STORE_NAME ).getReferenceSiteURL();
	} ),

	/**
	 * Returns true if this site supports AMP.
	 *
	 * @since 1.7.0
	 * @since 1.11.0 Renamed from isAmp to isAMP.
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} `true` if AMP support is enabled, `false` if not. Returns `undefined` if not loaded.
	 */
	isAMP: createRegistrySelector( ( select ) => () => {
		const ampMode = select( STORE_NAME ).getAMPMode();

		if ( ampMode === undefined ) {
			return undefined;
		}

		return !! ampMode;
	} ),

	/**
	 * Checks if the site is in the primary AMP mode.
	 *
	 * @since 1.12.0
	 *
	 * @return {(boolean|undefined)} `true` or `false` if the site is in the primary AMP mode. Returns `undefined` if not loaded.
	 */
	isPrimaryAMP: createRegistrySelector( ( select ) => () => {
		const ampMode = select( STORE_NAME ).getAMPMode();

		if ( ampMode === undefined ) {
			return undefined;
		}

		return ampMode === AMP_MODE_PRIMARY;
	} ),

	/**
	 * Checks if the site is in a secondary AMP mode.
	 *
	 * @since 1.12.0
	 *
	 * @return {(boolean|undefined)} `true` or `false` if the site is in a secondary AMP mode. Returns `undefined` if not loaded.
	 */
	isSecondaryAMP: createRegistrySelector( ( select ) => () => {
		const ampMode = select( STORE_NAME ).getAMPMode();

		if ( ampMode === undefined ) {
			return undefined;
		}

		return ampMode === AMP_MODE_SECONDARY;
	} ),

	/**
	 * Gets a site's timezone.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The timezone.
	 */
	getTimezone: getSiteInfoProperty( 'timezone' ),

	/**
	 * Returns true if this site is using the proxy service.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} `true` if the proxy service is in use, `false` if not. Returns `undefined` if not loaded.
	 */
	isUsingProxy: getSiteInfoProperty( 'usingProxy' ),

	/**
	 * Gets a site's name.
	 *
	 * @since 1.9.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} The site name.
	 */
	getSiteName: getSiteInfoProperty( 'siteName' ),

	/**
	 * Gets the 'permaLink' query parameter.
	 *
	 * @since 1.18.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|boolean)} Value of the 'permaLink' query parameter or `false` if not set.
	 */
	getPermaLinkParam: ( state ) => {
		if ( state.permaLink ) {
			return state.permaLink;
		}

		const queryArg = getQueryArg( global.location.href, 'permaLink' );
		return queryArg ? queryArg : false;
	},

	/**
	 * Gets external help links which includes the user's locale.
	 *
	 * @since 1.24.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {Object} [args]       Optional arguments for the resulting URL.
	 * @param {string} [args.path]  Base URL to build complete URL with starting slash.
	 * @param {Object} [args.query] Object to append query to the URL.
	 * @param {string} [args.hash]  Optional hash.
	 * @return {(string|null)} The URL containing the user's locale or `null` if path is not set.
	 */
	getGoogleSupportURL: ( state, args ) => {
		const { path, query, hash } = args || {};

		if ( ! path ) {
			return null;
		}

		const url = new URL( addQueryArgs( `https://support.google.com${ path }`, { ...query, hl: getLocale() } ) );
		url.hash = hash || '';

		return url.toString();
	},

	/**
	 * Returns true if this site has the Web Stories plugin enabled.
	 *
	 * @since 1.27.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} `true` if the Web Stories plugin is enabled, `false` if not. Returns `undefined` if not loaded.
	 */
	isWebStoriesActive: getSiteInfoProperty( 'webStoriesActive' ),

	/**
	 * Determines whether the provided URL matches reference site URL or not.
	 *
	 * @since 1.32.0
	 *
	 * @param {string} url The URL to compare with the reference site URL.
	 * @return {boolean} TRUE if the URL matches reference site URL, otherwise FALSE.
	 */
	isSiteURLMatch: createRegistrySelector( ( select ) => ( state, url ) => {
		const referenceURL = select( STORE_NAME ).getReferenceSiteURL();
		return normalizeURL( referenceURL ) === normalizeURL( url );
	} ),

	/**
	 * Gets an array with site URL permutations.
	 *
	 * @since 1.34.0
	 *
	 * @return {Array.<string>} An array with permutations.
	 */
	getSiteURLPermutations: createRegistrySelector( ( select ) => () => {
		const referenceURL = select( STORE_NAME ).getReferenceSiteURL();
		const permutations = [];

		const url = new URL( referenceURL );
		url.hostname = url.hostname.replace( /^www\./i, '' );

		url.protocol = 'http';
		permutations.push( untrailingslashit( url ) );

		url.protocol = 'https';
		permutations.push( untrailingslashit( url ) );

		url.hostname = 'www.' + url.hostname;
		permutations.push( untrailingslashit( url ) );

		url.protocol = 'http';
		permutations.push( untrailingslashit( url ) );

		return permutations;
	} ),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
