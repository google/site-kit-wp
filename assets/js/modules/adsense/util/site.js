/**
 * Site utilities.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { escapeRegExp } from 'lodash';

/**
 * Determines the AdSense site from the given domain.
 *
 * This utility function should be used in combination with data retrieved from
 * the datastore, hence passing undefined (loading state) is supported.
 *
 * @since 1.72.0
 *
 * @param {(Array|undefined)}  sites  Array of AdSense site objects retrieved from the API.
 * @param {(string|undefined)} domain The domain string to match to a site.
 * @return {(Object|null|undefined)} AdSense site object that matches the domain, null if no match
 * found or undefined if any of the parameters are undefined.
 */
export const determineSiteFromDomain = ( sites, domain ) => {
	if (
		undefined === sites ||
		undefined === domain ||
		! Array.isArray( sites )
	) {
		return undefined;
	}
	// Only consider sites with state (essentially non-subdomains).
	const sitesWithState = sites.filter( ( { state } ) => !! state );

	// Look for an exact match first.
	const exactMatch = sitesWithState.find(
		( site ) => site.domain === domain.toLowerCase()
	);

	if ( exactMatch ) {
		return exactMatch;
	}

	const subdomainMatch = sitesWithState.find( ( site ) => {
		// Note the prefixed `.` to ensure only a subdomain is matched
		// not simply a substring of a longer domain with the same ending.
		const inclusiveRegExp = new RegExp(
			`\\.${ escapeRegExp( site.domain ) }$`,
			'i' // case-insensitive
		);
		// Check to see if `domain` is a subdomain of the site
		return inclusiveRegExp.test( domain );
	} );

	return subdomainMatch || null;
};
