/**
 * Utility functions for Tags
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
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { tagMatchers as setupTagMatchers } from '../components/setup/constants';
import { default as adsenseTagMatchers } from '../modules/adsense/util/tagMatchers';
import { default as analyticsTagMatchers } from '../modules/analytics/util/tagMatchers';
import { tagMatchers as tagmanagerTagMatchers } from '../modules/tagmanager/util';

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
