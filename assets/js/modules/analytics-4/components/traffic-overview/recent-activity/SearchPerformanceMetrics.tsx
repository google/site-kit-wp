/**
 * Recent activity search performance metrics.
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
import { Fragment, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	Select,
	useDispatch,
	useInViewSelect,
	useSelect,
} from 'googlesitekit-data';
import Typography from '@/js/components/Typography';
import { SIZE_MEDIUM, TYPE_LABEL } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { ErrorObject } from '@/js/util/errors';
import FreshMetric from './FreshMetric';
import FreshMetricsGroup from './FreshMetricsGroup';
import {
	FRESH_DATA_FETCH_OPTIONS,
	getSearchPerformanceReportOptions,
} from './reportOptions';
import {
	SearchConsoleHourRow,
	aggregateSearchConsoleRows,
} from './utils/aggregateSearchConsoleRows';

export interface SearchPerformanceMetricsProps {
	/** The start of the last 24 hours, from `getFreshDataWindowStart()`. */
	windowStart: number;
}

const SearchPerformanceMetrics: FC< SearchPerformanceMetricsProps > = ( {
	windowStart,
} ) => {
	const reportOptions = useMemo(
		() => getSearchPerformanceReportOptions( windowStart ),
		[ windowStart ]
	);

	const report = useInViewSelect< SearchConsoleHourRow[] | undefined >(
		( select: Select ) =>
			select( MODULES_SEARCH_CONSOLE ).getReport(
				reportOptions,
				FRESH_DATA_FETCH_OPTIONS
			),
		[ reportOptions ]
	);

	// The store saves a report's error under its options alone, without the
	// fetch options.
	const error: ErrorObject | undefined = useSelect(
		( select: Select ) =>
			select( MODULES_SEARCH_CONSOLE ).getErrorForSelector( 'getReport', [
				reportOptions,
			] ),
		[ reportOptions ]
	);

	const { invalidateResolution } = useDispatch( MODULES_SEARCH_CONSOLE );

	// "Retry" requests again only reports without fetch options, so this
	// requests the Search Console report again.
	function handleRetry() {
		invalidateResolution( 'getReport', [
			reportOptions,
			FRESH_DATA_FETCH_OPTIONS,
		] );
	}

	const searchPerformance =
		report && aggregateSearchConsoleRows( report, windowStart );

	// A search result is shown before it is clicked, so no impressions means
	// no search data at all.
	const hasNoSearchData = searchPerformance?.impressions === 0;

	return (
		<FreshMetricsGroup
			title={ __( 'Search performance', 'google-site-kit' ) }
			moduleSlug={ MODULE_SLUG_SEARCH_CONSOLE }
			error={ error }
			onRetry={ handleRetry }
		>
			{ hasNoSearchData ? (
				<div className="googlesitekit-traffic-overview__fresh-metrics-empty">
					<Typography as="p" type={ TYPE_LABEL } size={ SIZE_MEDIUM }>
						{ __( 'No recent Search data yet', 'google-site-kit' ) }
					</Typography>
					<P size={ SIZE_MEDIUM }>
						{ __(
							'Search Console hasn’t reported clicks or impressions in the last 24 hours.',
							'google-site-kit'
						) }
					</P>
				</div>
			) : (
				<Fragment>
					<FreshMetric
						label={ __( 'Search clicks', 'google-site-kit' ) }
						value={ searchPerformance?.clicks }
					/>
					<FreshMetric
						label={ __( 'Search impressions', 'google-site-kit' ) }
						value={ searchPerformance?.impressions }
					/>
				</Fragment>
			) }
		</FreshMetricsGroup>
	);
};

export default SearchPerformanceMetrics;
