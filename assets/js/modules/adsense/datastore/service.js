/**
 * `modules/adsense` data store: service.
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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ADSENSE } from './constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { parseDomain } from '../util/url';

const { createRegistrySelector } = Data;

export const selectors = {
	/**
	 * Gets a URL to the service.
	 *
	 * @since 1.14.0
	 *
	 * @param {Object} state        Data store's state.
	 * @param {Object} [args]       Object containing optional path and query args.
	 * @param {string} [args.path]  A path to append to the base url.
	 * @param {Object} [args.query] Object of query params to be added to the URL.
	 * @return {(string|undefined)} The URL to the service, or `undefined` if not loaded.
	 */
	getServiceURL: createRegistrySelector(
		( select ) =>
			( state, { path, query } = {} ) => {
				// Note: /u/0 is necessary to keep here in order for paths to be resolved properly;
				// AccountChooser will update this part of the URL accordingly.
				let serviceURL = 'https://www.google.com/adsense/new/u/0';

				if ( path ) {
					const sanitizedPath = `/${ path.replace( /^\//, '' ) }`;
					serviceURL = `${ serviceURL }${ sanitizedPath }`;
				}

				if ( query ) {
					serviceURL = addQueryArgs( serviceURL, query );
				}

				const accountChooserBaseURI =
					select( CORE_USER ).getAccountChooserURL( serviceURL );

				if ( accountChooserBaseURI === undefined ) {
					return undefined;
				}

				return accountChooserBaseURI;
			}
	),

	/**
	 * Returns the service URL for creating a new AdSense account.
	 *
	 * @since 1.14.0
	 *
	 * @return {(string|undefined)} AdSense URL to create a new account (or `undefined` if not loaded).
	 */
	getServiceCreateAccountURL: createRegistrySelector( ( select ) => () => {
		const siteURL = select( CORE_SITE ).getReferenceSiteURL();

		const query = {
			source: 'site-kit',
			utm_source: 'site-kit',
			utm_medium: 'wordpress_signup',
		};
		if ( undefined !== siteURL ) {
			query.url = siteURL;
		}

		return addQueryArgs( 'https://www.google.com/adsense/signup', query );
	} ),

	/**
	 * Returns the service URL to an AdSense account's overview page.
	 *
	 * @since 1.14.0
	 *
	 * @return {(string|undefined)} AdSense account overview URL (or `undefined` if not loaded).
	 */
	getServiceAccountURL: createRegistrySelector( ( select ) => () => {
		const accountID = select( MODULES_ADSENSE ).getAccountID();

		if ( accountID === undefined ) {
			return undefined;
		}

		const query = { source: 'site-kit' };

		return select( MODULES_ADSENSE ).getServiceURL( { accountID, query } );
	} ),

	/**
	 * Returns the service URL to an AdSense account report.
	 *
	 * @since 1.27.0
	 *
	 * @param {Object} reportArgs URL parameters to be passed to the query.
	 * @return {(string|undefined)} AdSense account site overview URL (or `undefined` if not loaded).
	 */
	getServiceReportURL: createRegistrySelector(
		( select ) => ( state, reportArgs ) => {
			const accountID = select( MODULES_ADSENSE ).getAccountID();

			if ( accountID === undefined ) {
				return undefined;
			}
			const query = {
				...reportArgs,
			};
			const siteURL = select( CORE_SITE ).getReferenceSiteURL();
			const domain = siteURL && parseDomain( siteURL );

			if ( domain ) {
				query.dd = `1YsiteY1Y${ domain }Y${ domain }`;
			}

			const path = `${ accountID }/reporting`;

			return select( MODULES_ADSENSE ).getServiceURL( { path, query } );
		}
	),

	/**
	 * Returns the service URL to an AdSense account's site management page.
	 *
	 * @since 1.14.0
	 *
	 * @return {(string|undefined)} AdSense account site management URL (or `undefined` if not loaded).
	 */
	getServiceAccountManageSiteURL: createRegistrySelector(
		( select ) => () => {
			const accountID = select( MODULES_ADSENSE ).getAccountID();
			const siteURL = select( CORE_SITE ).getReferenceSiteURL();

			if ( accountID === undefined || siteURL === undefined ) {
				return undefined;
			}

			const path = `${ accountID }/sites/my-sites`;
			const query = {
				source: 'site-kit',
				url: parseDomain( siteURL ) || siteURL,
			};

			return select( MODULES_ADSENSE ).getServiceURL( { path, query } );
		}
	),

	/**
	 * Returns the service URL to the AdSense sites list.
	 *
	 * @since 1.14.0
	 *
	 * @return {(string|undefined)} AdSense account sites list URL (or `undefined` if not loaded).
	 */
	getServiceAccountManageSitesURL: createRegistrySelector(
		( select ) => () => {
			const accountID = select( MODULES_ADSENSE ).getAccountID();

			if ( accountID === undefined ) {
				return undefined;
			}

			const path = `${ accountID }/sites/my-sites`;
			const query = { source: 'site-kit' };

			return select( MODULES_ADSENSE ).getServiceURL( { path, query } );
		}
	),

	/**
	 * Returns the service URL to an AdSense account's site ads preview page.
	 *
	 * @since 1.14.0
	 *
	 * @return {(string|undefined)} AdSense account site ads preview URL (or `undefined` if not loaded).
	 */
	getServiceAccountSiteAdsPreviewURL: createRegistrySelector(
		( select ) => () => {
			const accountID = select( MODULES_ADSENSE ).getAccountID();
			const siteURL = select( CORE_SITE ).getReferenceSiteURL();

			if ( accountID === undefined || siteURL === undefined ) {
				return undefined;
			}

			const path = `${ accountID }/myads/sites/preview`;
			const query = {
				source: 'site-kit',
				url: parseDomain( siteURL ) || siteURL,
			};

			return select( MODULES_ADSENSE ).getServiceURL( { path, query } );
		}
	),
};

const store = {
	selectors,
};

export default store;
