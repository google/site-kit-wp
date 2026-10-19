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
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { TableTileRow } from '@/js/modules/analytics-4/components/common/tiles';
import { getPageURL } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPageURL';
import { getPlainPermalinkPagePath } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPlainPermalinkPagePath';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import { getMetricCount } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { PagePathPost } from '@/js/modules/analytics-4/datastore/fresh-data';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { ErrorObject } from '@/js/util/errors';
import { FreshDataDateRange } from './useFreshDataDateRange';
import { useFreshDataReport } from './useFreshDataReport';
import { usePostsByPagePath } from './usePostsByPagePath';

export interface PlainPermalinkTopPostsColumn {
	/** The rows the column renders, one for each post, each with its share of the report's total. */
	rows: TableTileRow[];
	/** The report's total, the site's views in the tab's date range, or `0` until the report loads. */
	total: number;
	/** `true` until the site info has loaded and the requests for the report, and then for the posts of its URLs, have finished. */
	loading: boolean;
	/** The error of the report, or `undefined` when its request hasn't failed. */
	error?: ErrorObject;
	/** Requests the report again. */
	retry: () => void;
}

/**
 * Resolves the "Top posts by visitors" column on a site with plain permalinks.
 *
 * The column reads each URL of its report the way WordPress reads it. It adds
 * up the views of the URLs of each post, and leaves out the URLs that show no
 * single published post, such as a search. It finds the posts of the 50 page
 * paths with the most views, so a post that only less viewed page paths show
 * is left out. When the request for the posts fails, each row is a page path
 * instead, such as `/?p=123`, with no error.
 *
 * @since n.e.x.t
 *
 * @param {Function}    buildReportOptions The function that builds the column's report options from the tab's date range, as `useFreshDataReport()` expects.
 * @param {string|null} excludedPostType   The post type whose posts the column leaves out, such as `product`, or `null` to keep every post.
 * @return {Object} The column's rows, the report's total, whether it is loading, the error of its report, and a function that requests the report again.
 */
export function usePlainPermalinkTopPostsColumn(
	buildReportOptions: (
		dateRange: FreshDataDateRange
	) => ReportOptions | undefined,
	excludedPostType: string | null
): PlainPermalinkTopPostsColumn {
	const {
		report,
		loading: reportLoading,
		error: reportError,
		retry: retryReport,
	} = useFreshDataReport( buildReportOptions );

	const siteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	const publicQueryVars = useSelect(
		( select: Select ) => select( CORE_SITE ).getPublicQueryVars(),
		[]
	);

	const isSiteInfoLoaded = !! siteURL && !! publicQueryVars;

	// The page path that WordPress reads from each URL of the report, such as
	// `/?p=123` for `/?p=123&utm_source=newsletter`.
	const pagePathByURL = useMemo( () => {
		const pagePaths = new Map< string, string | undefined >();

		if ( ! isSiteInfoLoaded ) {
			return pagePaths;
		}

		( report?.rows ?? [] ).forEach( ( row ) => {
			const url = row.dimensionValues?.[ 0 ]?.value ?? '';

			pagePaths.set(
				url,
				getPlainPermalinkPagePath( url, siteURL, publicQueryVars )
			);
		} );

		return pagePaths;
	}, [ report, isSiteInfoLoaded, siteURL, publicQueryVars ] );

	const mostViewedPagePaths = useMemo( () => {
		const views = new Map< string, number >();

		( report?.rows ?? [] ).forEach( ( row ) => {
			const pagePath = pagePathByURL.get(
				row.dimensionValues?.[ 0 ]?.value ?? ''
			);

			if ( pagePath ) {
				views.set(
					pagePath,
					( views.get( pagePath ) ?? 0 ) + getMetricCount( row )
				);
			}
		} );

		return Array.from( views )
			.filter( ( [ , count ] ) => count > 0 )
			.sort( ( first, second ) => second[ 1 ] - first[ 1 ] )
			.slice( 0, 50 )
			.map( ( [ pagePath ] ) => pagePath );
	}, [ report, pagePathByURL ] );

	const {
		posts,
		loading: postsLoading,
		error: postsError,
	} = usePostsByPagePath( mostViewedPagePaths );

	const rows = useMemo( () => {
		if ( postsError ) {
			return getRecentTrafficBreakdownRows( report, ( url ) =>
				pagePathByURL.get( url )
			).map( ( row ) => ( {
				...row,
				url: getPageURL( siteURL, row.label ),
			} ) );
		}

		if ( ! posts ) {
			return [];
		}

		const postByURL = new Map< string, PagePathPost >();

		pagePathByURL.forEach( ( pagePath, url ) => {
			const post = pagePath ? posts[ pagePath ] : undefined;

			if ( post && post.postType !== excludedPostType ) {
				postByURL.set( url, post );
			}
		} );

		const postByID = new Map(
			Array.from( postByURL.values(), ( post ) => [
				String( post.id ),
				post,
			] )
		);

		return getRecentTrafficBreakdownRows( report, ( url ) => {
			const post = postByURL.get( url );

			return post ? String( post.id ) : undefined;
		} ).map( ( row ) => {
			const { title, url } = postByID.get( row.label ) as PagePathPost;
			const { pathname, search } = new URL( url );

			return {
				...row,
				// A post with no title shows the path and query string of its
				// permalink, such as `/?p=12`.
				label: title || `${ pathname }${ search }`,
				url,
			};
		} );
	}, [
		report,
		pagePathByURL,
		posts,
		postsError,
		siteURL,
		excludedPostType,
	] );

	return {
		rows,
		total: getMetricCount( report?.totals?.[ 0 ] ),
		loading: ! isSiteInfoLoaded || reportLoading || postsLoading,
		error: reportError,
		retry: retryReport,
	};
}
