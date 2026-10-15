/**
 * Traffic Overview `usePlainPermalinkPostTitles` hook.
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
 * External dependencies
 */
import { compact, map, partition, sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { getPlainPermalinkPost } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPlainPermalinkPost';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { PostTitlesOptions } from '@/js/modules/analytics-4/datastore/fresh-data';
import { PageTitles } from './useReportPageTitles';

/**
 * Resolves the titles of the posts and pages that the given plain permalinks
 * show, by the ID of each post and page.
 *
 * A post that WordPress doesn't return, such as a deleted post, and a
 * permalink of no post or page have no title in `titles`. When the request
 * for the titles fails, no page path has a title.
 *
 * @since n.e.x.t
 *
 * @param {Array<string>} pagePaths The plain permalinks of the posts and pages, as paths and query strings, such as `/?p=123`. With none, the hook requests no titles.
 * @param {string}        [siteURL] Optional. The URL of the site, such as `https://example.com`. Without it, the hook requests no titles.
 * @return {Object} The titles, by page path, and whether they are loading.
 */
export function usePlainPermalinkPostTitles(
	pagePaths: string[],
	siteURL?: string
): PageTitles {
	const posts = useMemo(
		() =>
			siteURL
				? compact(
						pagePaths.map( ( pagePath ) =>
							getPlainPermalinkPost( pagePath, siteURL )
						)
				  )
				: [],
		[ pagePaths, siteURL ]
	);

	// The store keeps titles under the list of IDs, so sorted IDs let the same
	// posts in another order use the stored titles.
	const options = useMemo< PostTitlesOptions | undefined >( () => {
		if ( ! posts.length ) {
			return undefined;
		}

		const [ postsOfTypePost, postsOfTypePage ] = partition( posts, {
			type: 'post',
		} );

		return {
			postIDs: sortBy( map( postsOfTypePost, 'id' ) ),
			pageIDs: sortBy( map( postsOfTypePage, 'id' ) ),
		};
	}, [ posts ] );

	const postTitles = useInViewSelect< Record< number, string > | undefined >(
		( select: Select ) =>
			options
				? select( MODULES_ANALYTICS_4 ).getPostTitles( options )
				: undefined,
		[ options ]
	);

	// `getPostTitles` returns `undefined` both while the titles load and after
	// their request fails, so the end of the request is read from the store.
	const hasRequestFinished = useSelect(
		( select: Select ) =>
			! options ||
			select( MODULES_ANALYTICS_4 ).hasFinishedResolution(
				'getPostTitles',
				[ options ]
			),
		[ options, postTitles ]
	);

	const titles = useMemo(
		() =>
			postTitles &&
			Object.fromEntries(
				posts
					.filter( ( { id } ) => postTitles[ id ] )
					.map( ( { path, id } ) => [ path, postTitles[ id ] ] )
			),
		[ posts, postTitles ]
	);

	return { titles, loading: ! hasRequestFinished };
}
