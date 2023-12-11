/**
 * Utility functions for Tags
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
import { memoize } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs, isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { AMP_MODE_SECONDARY } from '../googlesitekit/datastore/site/constants';

/**
 * Extracts a tag from the given HTML string matched by given matchers.
 *
 * @since 1.13.0
 *
 * @param {string} html        The string of html from which to extract the tag.
 * @param {Array}  tagMatchers An array of the matchers to use.
 * @return {(string|boolean)} The tag id if found, otherwise false.
 */
export const extractExistingTag = ( html, tagMatchers ) => {
	const matchingPattern = tagMatchers.find( ( pattern ) =>
		pattern.test( html )
	);

	if ( matchingPattern ) {
		return matchingPattern.exec( html )[ 1 ];
	}

	return false;
};

/**
 * Gets the existing tag URLs.
 *
 * @since 1.13.0
 *
 * @param {Object} args           Arguments to use to get URLs.
 * @param {string} args.homeURL   The site's home URL.
 * @param {string} [args.ampMode] Optional. The site's AMP mode.
 * @return {Array} An array of the existing tag URLs.
 */
export const getExistingTagURLs = memoize( async ( { homeURL, ampMode } ) => {
	invariant( isURL( homeURL ), 'homeURL must be valid URL' );

	// Initialize urls with home URL
	const urls = [ homeURL ];

	// Add first post in AMP mode if AMP mode is secondary.
	if ( AMP_MODE_SECONDARY === ampMode ) {
		try {
			const ampPostURL = await apiFetch( {
				path: '/wp/v2/posts?per_page=1',
			} ).then( ( posts ) =>
				posts
					.slice( 0, 1 )
					.map( ( post ) => addQueryArgs( post.link, { amp: 1 } ) )
					.pop()
			);
			if ( ampPostURL ) {
				urls.push( ampPostURL );
			}
		} catch {
			return urls;
		}
	}

	return urls;
} );
