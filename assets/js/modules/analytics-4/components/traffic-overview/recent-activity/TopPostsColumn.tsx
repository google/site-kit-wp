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
import { useRecentTrafficBreakdownColumn } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useRecentTrafficBreakdownColumn';
import { useReportPageTitles } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useReportPageTitles';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import RecentActivityErrorNotice from './RecentActivityErrorNotice';
import { getTopPostsReportOptions } from './reportOptions';
import { getPageURL } from './utils/getPageURL';

const TopPostsColumn: FC = () => {
	const excludedProducts = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getExcludedProducts(),
		[]
	);

	const siteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	// The options wait for the product pages to leave out, so the report isn't
	// requested first without its product filter.
	const buildReportOptions = useCallback(
		( dateRange: FreshDataDateRange ) =>
			excludedProducts === undefined
				? undefined
				: getTopPostsReportOptions( dateRange, excludedProducts ),
		[ excludedProducts ]
	);

	const {
		reportOptions,
		rows: pathRows,
		loading,
		error,
		retry,
	} = useRecentTrafficBreakdownColumn( buildReportOptions );

	const pagePaths = useMemo(
		() => pathRows.map( ( { label } ) => label ),
		[ pathRows ]
	);

	const { titles, loading: titlesLoading } = useReportPageTitles(
		pagePaths,
		reportOptions
	);

	const rows = pathRows.map( ( row ) => ( {
		...row,
		// A page with no title shows its path, also when the request for the
		// titles fails.
		label: titles?.[ row.label ] || row.label,
		url: getPageURL( siteURL, row.label ),
	} ) );

	return (
		<TableTile
			title={ __( 'Top posts by visitors', 'google-site-kit' ) }
			titleAs="h4"
			rows={ rows }
			loading={ loading || titlesLoading }
			error={ error }
			onRetry={ retry }
			ErrorComponent={ RecentActivityErrorNotice }
		/>
	);
};

export default TopPostsColumn;
