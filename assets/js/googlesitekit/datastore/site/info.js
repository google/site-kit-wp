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
import { CORE_SITE, AMP_MODE_PRIMARY, AMP_MODE_SECONDARY } from './constants';
import { normalizeURL, untrailingslashit } from '../../../util';

const { createRegistrySelector } = Data;

function getSiteInfoProperty( propName ) {
	return createRegistrySelector( ( select ) => () => {
		const siteInfo = select( CORE_SITE ).getSiteInfo() || {};
		return siteInfo[ propName ];
	} );
}

// Actions
const RECEIVE_SITE_INFO = 'RECEIVE_SITE_INFO';
const RECEIVE_PERMALINK_PARAM = 'RECEIVE_PERMALINK_PARAM';
const SET_SITE_KIT_AUTO_UPDATES_ENABLED = 'SET_SITE_KIT_AUTO_UPDATES_ENABLED';

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

	/**
	 * Sets `siteKitAutoUpdatesEnabled` value; if set to `true` this will
	 * enable auto-updates for Site Kit. Set to `false` to disable this
	 * behaviour.
	 *
	 * @since 1.93.0
	 *
	 * @param {boolean} siteKitAutoUpdatesEnabled Whether Site Kit auto-updates are enabled.
	 * @return {Object} Redux-style action.
	 */
	setSiteKitAutoUpdatesEnabled( siteKitAutoUpdatesEnabled ) {
		invariant(
			typeof siteKitAutoUpdatesEnabled === 'boolean',
			'siteKitAutoUpdatesEnabled must be a boolean.'
		);

		return {
			payload: { siteKitAutoUpdatesEnabled },
			type: SET_SITE_KIT_AUTO_UPDATES_ENABLED,
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
				setupErrorCode,
				setupErrorMessage,
				setupErrorRedoURL,
				siteName,
				timezone,
				usingProxy,
				webStoriesActive,
				proxySupportLinkURL,
				widgetsAdminURL,
				postTypes,
				wpVersion,
				updateCoreURL,
				changePluginAutoUpdatesCapacity,
				siteKitAutoUpdatesEnabled,
				pluginBasename,
				productBasePaths,
				isKeyMetricsSetupComplete,
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
					setupErrorCode,
					setupErrorMessage,
					setupErrorRedoURL,
					siteName,
					timezone,
					usingProxy,
					webStoriesActive,
					proxySupportLinkURL,
					widgetsAdminURL,
					postTypes,
					wpVersion,
					updateCoreURL,
					changePluginAutoUpdatesCapacity,
					siteKitAutoUpdatesEnabled,
					pluginBasename,
					productBasePaths,
					isKeyMetricsSetupComplete,
				},
			};
		}

		case RECEIVE_PERMALINK_PARAM:
			const { permaLink } = payload;
			return {
				...state,
				permaLink,
			};

		case SET_SITE_KIT_AUTO_UPDATES_ENABLED:
			const { siteKitAutoUpdatesEnabled } = payload;
			return {
				...state,
				siteInfo: {
					...state.siteInfo,
					siteKitAutoUpdatesEnabled,
				},
			};

		default: {
			return state;
		}
	}
};

export const resolvers = {
	*getSiteInfo() {
		const registry = yield Data.commonActions.getRegistry();

		if ( registry.select( CORE_SITE ).getSiteInfo() ) {
			return;
		}

		if (
			! global._googlesitekitBaseData ||
			! global._googlesitekitEntityData
		) {
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
			setupErrorCode,
			setupErrorMessage,
			setupErrorRedoURL,
			siteName,
			timezone,
			usingProxy,
			webStoriesActive,
			proxySupportLinkURL,
			widgetsAdminURL,
			postTypes,
			wpVersion,
			updateCoreURL,
			changePluginAutoUpdatesCapacity,
			siteKitAutoUpdatesEnabled,
			pluginBasename,
			productBasePaths,
			isKeyMetricsSetupComplete,
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
			setupErrorCode,
			setupErrorMessage,
			setupErrorRedoURL,
			siteName,
			timezone,
			postTypes,
			usingProxy: !! usingProxy,
			webStoriesActive,
			proxySupportLinkURL,
			widgetsAdminURL,
			wpVersion,
			updateCoreURL,
			changePluginAutoUpdatesCapacity,
			siteKitAutoUpdatesEnabled,
			pluginBasename,
			productBasePaths,
			isKeyMetricsSetupComplete,
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
	getAdminURL: createRegistrySelector(
		( select ) =>
			( state, page, args = {} ) => {
				const { adminURL } = select( CORE_SITE ).getSiteInfo() || {};

				// Return adminURL if undefined, or if no page supplied.
				if ( adminURL === undefined || page === undefined ) {
					return adminURL;
				}

				const baseURL =
					adminURL[ adminURL.length - 1 ] === '/'
						? adminURL
						: `${ adminURL }/`;
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

				return addQueryArgs( `${ baseURL }${ phpFile }`, {
					page: pageArg,
					...queryArgs,
				} );
			}
	),

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
		const currentEntityURL = select( CORE_SITE ).getCurrentEntityURL();
		if ( currentEntityURL !== null ) {
			return currentEntityURL;
		}

		// Otherwise fall back to reference site URL.
		return select( CORE_SITE ).getReferenceSiteURL();
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
		const ampMode = select( CORE_SITE ).getAMPMode();

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
		const ampMode = select( CORE_SITE ).getAMPMode();

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
		const ampMode = select( CORE_SITE ).getAMPMode();

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
	 * Gets a setup error code, if one exists.
	 *
	 * @since 1.80.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|undefined)} An error code from setup, if one exists. Will be `null` if no error exists; `undefined` when loading.
	 */
	getSetupErrorCode: getSiteInfoProperty( 'setupErrorCode' ),

	/**
	 * Gets a setup error message, if one exists.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} An error message from setup, if one exists. Will be `null` if no error exists; `undefined` when loading.
	 */
	getSetupErrorMessage: getSiteInfoProperty( 'setupErrorMessage' ),

	/**
	 * Gets a setup redo URL, if one exists after encountering a setup error.
	 *
	 * This URL will be used to redo the setup process if a user encountered
	 * an error.
	 *
	 * @since 1.77.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null|undefined)} The setup URL, if one exists. Will be `null` if no error exists and thus the setup redo URL doesn't exist; `undefined` when loading.
	 */
	getSetupErrorRedoURL: getSiteInfoProperty( 'setupErrorRedoURL' ),

	/**
	 * Gets the proxy support URL.
	 *
	 * @since 1.80.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null)} The proxy support URL.
	 */
	getProxySupportLinkURL: getSiteInfoProperty( 'proxySupportLinkURL' ),

	/**
	 * Gets the admin widgets editor URL.
	 *
	 * @since 1.81.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(string|null)} The proxy support URL.
	 */
	getWidgetsAdminURL: getSiteInfoProperty( 'widgetsAdminURL' ),

	/**
	 * Gets the public post types.
	 *
	 * @since 1.81.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {Array.<Object>} The public post types.
	 */
	getPostTypes: getSiteInfoProperty( 'postTypes' ),

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
		const referenceURL = select( CORE_SITE ).getReferenceSiteURL();
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
		const referenceURL = select( CORE_SITE ).getReferenceSiteURL();
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

	/**
	 * Gets the WordPress version object.
	 *
	 * @since 1.85.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} WordPress version object.
	 */
	getWPVersion: getSiteInfoProperty( 'wpVersion' ),

	/**
	 * Gets the WordPress update core URL.
	 *
	 * @since 1.85.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} WordPress update core URL.
	 */
	getUpdateCoreURL: getSiteInfoProperty( 'updateCoreURL' ),

	/**
	 * Determines if Site Kit auto update settings can be changed.
	 *
	 * Auto update settings can not be changed if plugin updates are disabled site-wide
	 * or if Site Kit auto updates are enforced by a PHP filter.
	 *
	 * @since 1.93.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} `true` if plugin auto updates are enabled, otherwise `false`.
	 */
	hasChangePluginAutoUpdatesCapacity: getSiteInfoProperty(
		'changePluginAutoUpdatesCapacity'
	),

	/**
	 * Determines if the auto updates are enabled for the Site Kit plugin.
	 *
	 * @since 1.93.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {(boolean|undefined)} `true` if Site Kit auto updates are enabled, otherwise `false`.
	 */
	getSiteKitAutoUpdatesEnabled: getSiteInfoProperty(
		'siteKitAutoUpdatesEnabled'
	),

	/**
	 * Get the plugin basename.
	 *
	 * @since 1.93.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {string} The basename of plugin, e.g. `'google-site-kit/google-site-kit.php'`.
	 */
	getPluginBasename: getSiteInfoProperty( 'pluginBasename' ),

	/**
	 * Determines whether the current WordPress site has the minimum required version.
	 * Currently, the minimum required version is 5.2.
	 *
	 * @since 1.85.0
	 *
	 * @param {string} minimumWPVersion The minimum required WordPress version.
	 * @return {(boolean|undefined)} `true` if the WordPress site's version is greater than or equal to the minimum required version, `false` if not. Returns `undefined` if not loaded.
	 */
	hasMinimumWordPressVersion: createRegistrySelector(
		( select ) => ( state, minimumWPVersion ) => {
			invariant( minimumWPVersion, 'minimumWPVersion is required.' );

			const { major, minor } = select( CORE_SITE ).getWPVersion() || {};
			if ( major === undefined || minor === undefined ) {
				return undefined;
			}

			const [ minimumMajor, minimumMinor = 0 ] = minimumWPVersion
				.split( '.' )
				.map( ( v ) => parseInt( v, 10 ) );

			return (
				minimumMajor < major ||
				( minimumMajor === major && minimumMinor <= minor )
			);
		}
	),

	/**
	 * Gets base paths for products found in WordPress.
	 *
	 * @since 1.106.0
	 *
	 * @return {Array.<string>} The list of product base paths.
	 */
	getProductBasePaths: getSiteInfoProperty( 'productBasePaths' ),

	/**
	 * Checks if the Key Metrics widget has been setup either if at least one user
	 * has answered the User Input questionnaire or picked their own metrics.
	 *
	 * @since n.e.x.t
	 *
	 * @return {(boolean)} `true` if the Key Metrics widget has been setup, otherwise `false`.
	 */
	isKeyMetricsSetupComplete: getSiteInfoProperty(
		'isKeyMetricsSetupComplete'
	),
};

export default {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
};
