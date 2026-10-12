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
import { useMemo } from '@wordpress/element';
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
import { useFreshDataReport } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataReport';
import { getTopPostsReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/reportOptions';
import { getPageURL } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getPageURL';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/recent-activity/utils/getRecentTrafficBreakdownRows';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { decodeAmpersand } from '@/js/modules/analytics-4/utils';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';

const TopPostsColumn: FC = () => {
	const { reportOptions, report, loading, error, retry } = useFreshDataReport(
		getTopPostsReportOptions
	);

	// Each row's `label` is a page path.
	const pathRows = useMemo(
		() => getRecentTrafficBreakdownRows( report ),
		[ report ]
	);

	const pagePaths = useMemo(
		() => pathRows.map( ( { label } ) => label ),
		[ pathRows ]
	);

	// `getPageTitles` requests a title for each row of its report, so it
	// receives only the rows the column shows. `titlesError` is read for the
	// same page paths.
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
			shownRowsReport
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
			pagePaths.length
				? select( MODULES_ANALYTICS_4 ).getErrorForSelector(
						'getReport',
						[
							getPageTitlesReportOptions(
								reportOptions,
								pagePaths
							),
						]
				  )
				: undefined,
		[ pagePaths, reportOptions, titles ]
	);

	const siteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	const rows = useMemo(
		(): TableTileRow[] =>
			pathRows.map( ( row ) => {
				const pagePath = row.label;
				const title = decodeAmpersand(
					titles?.[ pagePath ] ?? ''
				).trim();

				return {
					...row,
					// A page that Analytics has no title for shows its path.
					label:
						title && title !== __( '(unknown)', 'google-site-kit' )
							? title
							: pagePath,
					url: getPageURL( siteURL, pagePath ),
				};
			} ),
		[ pathRows, titles, siteURL ]
	);

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
			// requests a failed report of pages again.
			onRetry={ error ? retry : undefined }
		/>
	);
};

export default TopPostsColumn;
