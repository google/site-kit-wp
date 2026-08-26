/**
 * Reader Revenue Manager "View on your site" URL hook.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { type Select, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';

interface SearchResult {
	url?: string;
}

/**
 * Resolves the URL to preview the CTA on the site, based on the configured
 * CTA placement.
 *
 * For the `sitewide` placement this is the site's front page. For the
 * `post_types` placement it is the first public post matching one of the
 * selected post types. Any other placement, or an unresolvable post URL,
 * yields `undefined` so the calling component can omit the CTA.
 *
 * @since n.e.x.t
 *
 * @return {(string|undefined)} The URL, or `undefined` if there is none.
 */
export default function useViewOnSiteURL(): string | undefined {
	const snippetMode = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getSnippetMode(),
		[]
	);

	const postTypes = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPostTypes(),
		[]
	);

	const homeURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getHomeURL(),
		[]
	);

	const [ postURL, setPostURL ] = useState< string | undefined >();

	// Join the post types so the effect only re-runs when they actually change.
	const subtype = Array.isArray( postTypes ) ? postTypes.join( ',' ) : '';

	useEffect( () => {
		let ignore = false;

		async function resolvePostURL() {
			if ( snippetMode !== 'post_types' || ! subtype ) {
				return;
			}

			try {
				const results: SearchResult[] = await apiFetch( {
					path: addQueryArgs( '/wp/v2/search', {
						type: 'post',
						subtype,
						per_page: 1,
					} ),
				} );

				if ( ! ignore ) {
					setPostURL( results?.[ 0 ]?.url );
				}
			} catch {
				// Leave the URL unresolved; the caller omits the CTA.
			}
		}

		resolvePostURL();

		return () => {
			ignore = true;
		};
	}, [ snippetMode, subtype ] );

	if ( snippetMode === 'sitewide' ) {
		return homeURL;
	}

	if ( snippetMode === 'post_types' ) {
		return postURL;
	}

	return undefined;
}
