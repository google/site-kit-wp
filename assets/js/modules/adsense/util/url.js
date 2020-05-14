/**
 * URL utilities.
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
import { parse as pslParse } from 'psl';

/**
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Returns the URL for creating a new AdSense account.
 *
 * @since 1.9.0
 *
 * @param {Object}             options         Options for generating the URL.
 * @param {(string|undefined)} options.siteURL The initial site URL to create the account for.
 * @return {string} AdSense URL to create a new account.
 */
export const getCreateAccountURL = ( { siteURL } = {} ) => {
	const baseURL = 'https://www.google.com/adsense/signup/new';
	const queryParams = {
		// TODO: Check which of these parameters are actually required.
		source: 'site-kit',
		utm_source: 'site-kit',
		utm_medium: 'wordpress_signup',
	};
	if ( siteURL ) {
		queryParams.url = siteURL;
	}
	return addQueryArgs( baseURL, queryParams );
};

/**
 * Returns the URL to an AdSense account's overview page.
 *
 * @since 1.9.0
 *
 * @param {Object}             options           Options for generating the URL.
 * @param {(string|undefined)} options.accountID The AdSense account ID.
 * @param {(string|undefined)} options.userEmail The Google account email address. Relevant
 *                                               for users with multiple Google accounts.
 * @return {string} AdSense account overview URL.
 */
export const getAccountURL = ( { accountID, userEmail } = {} ) => {
	const baseURL = getAccountBaseURL( { accountID, userEmail, path: '/home' } );
	return addQueryArgs( baseURL, { source: 'site-kit' } );
};

/**
 * Returns the URL to an AdSense account's site overview page.
 *
 * @since 1.9.0
 *
 * @param {Object}             options           Options for generating the URL.
 * @param {(string|undefined)} options.accountID The AdSense account ID.
 * @param {(string|undefined)} options.siteURL   The site URL to link to in AdSense.
 * @param {(string|undefined)} options.userEmail The Google account email address. Relevant
 *                                               for users with multiple Google accounts.
 * @return {string} AdSense account site overview URL.
 */
export const getAccountSiteURL = ( { accountID, siteURL, userEmail } = {} ) => {
	const baseURL = getAccountBaseURL( { accountID, userEmail, path: '/sites/my-sites' } );
	const queryParams = { source: 'site-kit' };
	if ( siteURL ) {
		queryParams.url = parseDomain( siteURL ) || siteURL;
	}
	return addQueryArgs( baseURL, queryParams );
};

/**
 * Returns the URL to an AdSense account's site ads preview page.
 *
 * @since 1.9.0
 *
 * @param {Object}             options           Options for generating the URL.
 * @param {(string|undefined)} options.accountID The AdSense account ID.
 * @param {(string|undefined)} options.siteURL   The site URL to link to in AdSense.
 * @param {(string|undefined)} options.userEmail The Google account email address. Relevant
 *                                               for users with multiple Google accounts.
 * @return {string} AdSense account site ads preview URL.
 */
export const getAccountSiteAdsPreviewURL = ( { accountID, siteURL, userEmail } = {} ) => {
	const baseURL = getAccountBaseURL( { accountID, userEmail, path: '/myads/sites/preview' } );
	const queryParams = { source: 'site-kit' };
	if ( siteURL ) {
		queryParams.url = parseDomain( siteURL ) || siteURL;
	}
	return addQueryArgs( baseURL, queryParams );
};

/**
 * Returns a URL to an account screen in the AdSense frontend.
 *
 * @since 1.9.0
 *
 * @param {Object}             options           Options for generating the URL.
 * @param {(string|undefined)} options.accountID The AdSense account ID.
 * @param {(string|undefined)} options.userEmail The Google account email address. Relevant
 *                                               for users with multiple Google accounts.
 * @param {(string|undefined)} options.path      Additional path after the base URL generated.
 *                                               Only relevant if accountID is also provided.
 * @return {string} AdSense frontend URL.
 */
const getAccountBaseURL = ( { accountID, userEmail, path = '/home' } = {} ) => {
	let baseURL = 'https://www.google.com/adsense/new';
	if ( userEmail ) { // Allows to indicate which Google account to use.
		baseURL += `/u/${ userEmail }`;
	}
	if ( accountID ) {
		baseURL += `/${ accountID }`;
		if ( path ) {
			baseURL += path;
		}
	}
	return baseURL;
};

const parseDomain = ( url ) => {
	const urlObj = new URL( url );
	const { domain } = pslParse( urlObj.hostname );
	return domain;
};
