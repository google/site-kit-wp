/**
 * Recent activity top posts column.
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
import { FC } from 'react';

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
import { TableTile } from '@/js/modules/analytics-4/components/common/tiles';
import { FreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import { usePlainPermalinkPostTitles } from '@/js/modules/analytics-4/components/traffic-overview/hooks/usePlainPermalinkPostTitles';
import { useRecentTrafficBreakdownColumn } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useRecentTrafficBreakdownColumn';
import { useReportPageTitles } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useReportPageTitles';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getTopPostsReportOptions } from './reportOptions';
import { getPageURL } from './utils/getPageURL';
import { getPlainPermalinkPost } from './utils/getPlainPermalinkPost';

/**
 * No page paths, for the titles hook of the permalink structure the site
 * doesn't use. The same array on every render keeps that hook's memoized values.
 */
const NO_PAGE_PATHS: string[] = [];

const TopPostsColumn: FC = () => {
	const usingPlainPermalinks = useSelect(
		( select: Select ) => select( CORE_SITE ).isUsingPlainPermalinks(),
		[]
	);

	const excludedProducts = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getExcludedProducts(),
		[]
	);

	const siteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	// The options wait for both values, so the report isn't requested first
	// with the wrong options.
	const buildReportOptions = useCallback(
		( dateRange: FreshDataDateRange ) =>
			usingPlainPermalinks === undefined || excludedProducts === undefined
				? undefined
				: getTopPostsReportOptions( dateRange, {
						usingPlainPermalinks,
						excludedProducts,
				  } ),
		[ usingPlainPermalinks, excludedProducts ]
	);

	// On plain permalinks, a row of the report is a path and query string, such
	// as `/?p=123&utm_source=newsletter`. Labeling each row with the permalink
	// of its post, such as `/?p=123`, adds up the rows of the same post.
	const getRowLabel = useMemo(
		() =>
			usingPlainPermalinks
				? ( pagePathPlusQueryString: string ) =>
						getPlainPermalinkPost(
							pagePathPlusQueryString,
							siteURL
						)?.path
				: undefined,
		[ usingPlainPermalinks, siteURL ]
	);

	const {
		reportOptions,
		// Each row's `label` is a page path, or a plain permalink.
		rows: pathRows,
		loading,
		error,
		retry,
	} = useRecentTrafficBreakdownColumn( buildReportOptions, getRowLabel );

	const pagePaths = useMemo(
		() => pathRows.map( ( { label } ) => label ),
		[ pathRows ]
	);

	// Each hook requests titles only for its own permalink structure.
	const reportPageTitles = useReportPageTitles(
		usingPlainPermalinks ? NO_PAGE_PATHS : pagePaths,
		reportOptions
	);
	const plainPermalinkPostTitles = usePlainPermalinkPostTitles(
		usingPlainPermalinks ? pagePaths : NO_PAGE_PATHS,
		siteURL
	);
	const {
		titles,
		loading: titlesLoading,
		error: titlesError,
	} = usingPlainPermalinks ? plainPermalinkPostTitles : reportPageTitles;

	const rows = pathRows.map( ( row ) => ( {
		...row,
		// A page with no title shows its path.
		label: titles?.[ row.label ] || row.label,
		url: getPageURL( siteURL, row.label ),
	} ) );

	return (
		<TableTile
			title={ __( 'Top posts by visitors', 'google-site-kit' ) }
			titleAs="h4"
			rows={ rows }
			loading={ loading || titlesLoading }
			error={ error || titlesError }
			// The "Retry" button requests failed titles again by itself, so
			// `retry` is only for a failed report of pages or of the site's totals.
			onRetry={ error ? retry : undefined }
		/>
	);
};

export default TopPostsColumn;
