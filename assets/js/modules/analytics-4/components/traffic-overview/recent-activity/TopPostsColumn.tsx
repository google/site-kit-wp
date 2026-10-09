/**
 * Recent activity "Top posts by visitors" column.
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
import { useFreshDataReport } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataReport';
import { getRecentTrafficBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/utils/getRecentTrafficBreakdownRows';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { decodeAmpersand } from '@/js/modules/analytics-4/utils';
import { getPageTitlesReportOptions } from '@/js/modules/analytics-4/utils/page-titles-report';
import { getFullURL } from '@/js/util';
import RecentTrafficBreakdownColumn from './RecentTrafficBreakdownColumn';

export interface TopPostsColumnProps {
	/** The report options of the column's report, with the `pagePath` dimension and the `totalUsers` metric. */
	reportArgs: ReportOptions;
}

const TopPostsColumn: FC< TopPostsColumnProps > = ( { reportArgs } ) => {
	const { report, loading, error, retry } = useFreshDataReport( reportArgs );

	const rows = useMemo(
		() => getRecentTrafficBreakdownRows( report ),
		[ report ]
	);

	// The label of each row is a page path.
	const pagePaths = useMemo(
		() => rows.map( ( { label } ) => label ),
		[ rows ]
	);

	// `getPageTitles()` requests a title for each row of the report it
	// receives, so it receives the shown rows, not every page with visitors.
	const shownPagesReport = useMemo(
		() => ( {
			dimensionHeaders: [ { name: 'pagePath' } ],
			rows: pagePaths.map( ( pagePath ) => ( {
				dimensionValues: [ { value: pagePath } ],
			} ) ),
		} ),
		[ pagePaths ]
	);

	const titles = useInViewSelect< Record< string, string > | undefined >(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPageTitles(
				shownPagesReport,
				reportArgs
			),
		[ shownPagesReport, reportArgs ]
	);

	// `getPageTitles()` returns `undefined` when its report request fails, so
	// the column reads the error of that request.
	const titlesError = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getFirstReportError(
				getPageTitlesReportOptions( reportArgs, pagePaths )
			),
		[ reportArgs, pagePaths ]
	);

	const siteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	const rowsWithTitles = rows.map( ( row ) => {
		const pagePath = row.label;
		const title = decodeAmpersand( titles?.[ pagePath ] ?? '' ).trim();

		return {
			...row,
			label:
				title && title !== __( '(unknown)', 'google-site-kit' )
					? title
					: pagePath,
			// GA4 reports `(not set)` for a visit with no page path, so that row
			// gets no link.
			url: pagePath.startsWith( '/' )
				? getFullURL( siteURL, pagePath )
				: undefined,
		};
	} );

	return (
		<RecentTrafficBreakdownColumn
			title={ __( 'Top posts by visitors', 'google-site-kit' ) }
			rows={ rowsWithTitles }
			loading={ loading || ( titles === undefined && ! titlesError ) }
			error={ error || titlesError }
			onRetry={ retry }
		/>
	);
};

export default TopPostsColumn;
