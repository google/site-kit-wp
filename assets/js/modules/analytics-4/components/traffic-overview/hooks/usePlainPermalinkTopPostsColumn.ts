/**
 * Traffic Overview `usePlainPermalinkTopPostsColumn` hook.
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
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { TableTileRow } from '@/js/modules/analytics-4/components/common/tiles';
import { getPlainPermalinkTopPostsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { getPageURL } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPageURL';
import { getPlainPermalinkPagePath } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPlainPermalinkPagePath';
import {
	getRecentTrafficBreakdownRows,
	getRowCounts,
} from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import {
	MODULES_ANALYTICS_4,
	POSTS_BY_PAGE_PATH_MAX_PAGE_PATHS,
} from '@/js/modules/analytics-4/datastore/constants';
import { PagePathPost } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ErrorObject } from '@/js/util/errors';
import { FreshDataDateRange } from './useFreshDataDateRange';
import { useFreshDataReport } from './useFreshDataReport';
import { usePostsByPagePath } from './usePostsByPagePath';

interface PlainPermalinkTopPostsColumn {
	/** The rows the column renders: one for each post, or one for each page path after the request for the posts fails. */
	rows: TableTileRow[];
	/** `true` until the column's report has loaded, and then until the posts of its page paths have loaded. */
	loading: boolean;
	/** The error of the column's report, or `undefined` when its request hasn't failed. */
	error?: ErrorObject;
	/** Requests the column's report again. */
	retry: () => void;
	/** The message the column shows with no rows where the report has views, or `undefined` for the default message, which says the site had no visitors. */
	zeroState?: string;
}

/**
 * Resolves the report of the "Top posts by visitors" column on a site with plain permalinks, and builds the column's rows from it.
 *
 * On plain permalinks, which have no permalink structure, every post shares
 * the path of the home page, so the report reads each URL with its query
 * string. The column asks which post each of the 50 page paths with the most
 * views shows, and adds up the views of each post into one row, such as the
 * views of `/?p=1` and of `/?p=1&utm_source=newsletter`. When the request for
 * the posts fails, the column has one row for each page path instead.
 *
 * @since n.e.x.t
 *
 * @return {Object} The column's rows, its loading state, its report's error, a function that requests the report again, and its zero state message.
 */
export function usePlainPermalinkTopPostsColumn(): PlainPermalinkTopPostsColumn {
	const excludedProducts = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getExcludedProducts(),
		[]
	);

	const siteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	const publicQueryVars = useSelect(
		( select: Select ) => select( CORE_SITE ).getPublicQueryVars(),
		[]
	);

	// The options wait for the product URLs to leave out, so the report isn't
	// requested first without its product filter.
	const buildReportOptions = useCallback(
		( dateRange: FreshDataDateRange ) =>
			excludedProducts === undefined
				? undefined
				: getPlainPermalinkTopPostsReportOptions(
						dateRange,
						excludedProducts
				  ),
		[ excludedProducts ]
	);

	const {
		report,
		loading: reportLoading,
		error,
		retry,
	} = useFreshDataReport( buildReportOptions );

	const getPagePath = useCallback(
		( url: string ) =>
			getPlainPermalinkPagePath( url, siteURL, publicQueryVars ),
		[ siteURL, publicQueryVars ]
	);

	// The page paths come most viewed first.
	const pagePaths = useMemo(
		() =>
			report
				? getRowCounts( report, getPagePath )
						.slice( 0, POSTS_BY_PAGE_PATH_MAX_PAGE_PATHS )
						.map( ( { key } ) => key )
				: undefined,
		[ report, getPagePath ]
	);

	const {
		posts,
		loading: postsLoading,
		error: postsError,
	} = usePostsByPagePath( pagePaths );

	const rows = useMemo( () => {
		if ( posts && pagePaths ) {
			// The first page path of each post, its most viewed one, keys the
			// post's row, and labels a post with no title.
			const rowKeys = new Map< number, string >();

			pagePaths.forEach( ( pagePath ) => {
				const post = posts[ pagePath ];

				if ( post && ! rowKeys.has( post.id ) ) {
					rowKeys.set( post.id, pagePath );
				}
			} );

			return getRecentTrafficBreakdownRows( report, ( url ) => {
				const pagePath = getPagePath( url );
				const post = pagePath ? posts[ pagePath ] : null;

				return post ? rowKeys.get( post.id ) ?? null : null;
			} ).map( ( row ) => {
				// A row's key is a page path that shows a post.
				const post = posts[ row.label ] as PagePathPost;

				return {
					...row,
					label: post.title || row.label,
					url: post.url,
				};
			} );
		}

		if ( postsError ) {
			return getRecentTrafficBreakdownRows( report, getPagePath ).map(
				( row ) => ( { ...row, url: getPageURL( siteURL, row.label ) } )
			);
		}

		return [];
	}, [ posts, pagePaths, postsError, report, getPagePath, siteURL ] );

	const hasViews = useMemo(
		() => getRowCounts( report ).length > 0,
		[ report ]
	);

	return {
		rows,
		// Once the report has loaded, the column waits for the posts, so no row
		// shows a page path first.
		loading: reportLoading || ( report !== undefined && postsLoading ),
		error,
		retry,
		zeroState: hasViews
			? __(
					'No data to display: your posts haven’t received any visitors yet',
					'google-site-kit'
			  )
			: undefined,
	};
}
