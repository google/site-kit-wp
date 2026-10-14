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
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	TableTile,
	TableTileRow,
} from '@/js/modules/analytics-4/components/common/tiles';
import { FreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import { useRecentTrafficBreakdownColumn } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useRecentTrafficBreakdownColumn';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { decodeAmpersand } from '@/js/modules/analytics-4/utils';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';
import { getTopPostsReportOptions } from './reportOptions';
import { getPageURL } from './utils/getPageURL';

const TopPostsColumn: FC = () => {
	const excludedProductPathPrefix = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getExcludedProductPathPrefix(),
		[]
	);

	// The report waits until the column knows whether to omit product pages,
	// so it isn't requested once without the filter and again with it.
	const buildReportOptions = useCallback(
		( dateRange: FreshDataDateRange ) =>
			excludedProductPathPrefix === undefined
				? undefined
				: getTopPostsReportOptions(
						dateRange,
						excludedProductPathPrefix
				  ),
		[ excludedProductPathPrefix ]
	);

	const {
		reportOptions,
		report,
		// Each row's `label` is a page path.
		rows: pathRows,
		loading,
		error,
		retry,
	} = useRecentTrafficBreakdownColumn( buildReportOptions );

	const pagePaths = useMemo(
		() => pathRows.map( ( { label } ) => label ),
		[ pathRows ]
	);

	// `getPageTitles` requests a title for each row of its report, so it
	// receives only the rows the column shows, and `titlesError` is read for
	// those same page paths.
	const shownRowsReport = useMemo< Report | undefined >(
		() =>
			report && {
				...report,
				rows: report.rows?.filter( ( row ) =>
					pagePaths.includes(
						row.dimensionValues?.[ 0 ]?.value ?? ''
					)
				),
			},
		[ report, pagePaths ]
	);

	const titles = useInViewSelect< Record< string, string > | undefined >(
		( select: Select ) =>
			shownRowsReport && reportOptions
				? select( MODULES_ANALYTICS_4 ).getPageTitles(
						shownRowsReport,
						reportOptions
				  )
				: undefined,
		[ shownRowsReport, reportOptions ]
	);

	// `getPageTitles` returns `undefined` both while the titles load and after
	// their request fails, so the error is read from the store.
	const titlesError = useSelect(
		( select: Select ) =>
			pagePaths.length && reportOptions
				? select( MODULES_ANALYTICS_4 ).getFirstReportError(
						getPageTitlesReportOptions( reportOptions, pagePaths )
				  )
				: undefined,
		[ pagePaths, reportOptions, titles ]
	);

	const siteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	const rows: TableTileRow[] = pathRows.map( ( row ) => {
		const pagePath = row.label;
		const title = decodeAmpersand( titles?.[ pagePath ] ?? '' ).trim();

		return {
			...row,
			// A page that Analytics has no title for shows its path.
			label:
				title && title !== __( '(unknown)', 'google-site-kit' )
					? title
					: pagePath,
			url: getPageURL( siteURL, pagePath ),
		};
	} );

	return (
		<TableTile
			title={ __( 'Top posts by visitors', 'google-site-kit' ) }
			titleAs="h4"
			rows={ rows }
			loading={
				loading ||
				( pagePaths.length > 0 &&
					titles === undefined &&
					! titlesError )
			}
			error={ error || titlesError }
			// The "Retry" button requests failed titles again by itself. `retry`
			// requests a failed report of pages, or of the site's visitors,
			// again.
			onRetry={ error ? retry : undefined }
		/>
	);
};

export default TopPostsColumn;
