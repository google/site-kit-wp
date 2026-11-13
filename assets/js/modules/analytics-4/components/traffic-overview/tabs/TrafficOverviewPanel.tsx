/**
 * Traffic Overview panel.
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
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useInViewSelect, useSelect } from 'googlesitekit-data';
import ReportError from '@/js/components/ReportError';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import { useFeature } from '@/js/hooks/useFeature';
import { PLACEHOLDER_TRAFFIC_BREAKDOWN } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/placeholderTrafficBreakdown';
import TrafficBreakdown from '@/js/modules/analytics-4/components/traffic-overview/breakdown/TrafficBreakdown';
import {
	getPlaceholderDailyTraffic,
	getPlaceholderPublishedPosts,
} from '@/js/modules/analytics-4/components/traffic-overview/charts/placeholderTrafficChartData';
import TrafficChart from '@/js/modules/analytics-4/components/traffic-overview/charts/TrafficChart';
import { PLACEHOLDER_TOTAL_VISITS } from '@/js/modules/analytics-4/components/traffic-overview/components/placeholderTotalVisits';
import TotalVisitors from '@/js/modules/analytics-4/components/traffic-overview/components/TotalVisitors';
import TrafficInsightNotice from '@/js/modules/analytics-4/components/traffic-overview/components/TrafficInsightNotice';
import { TRAFFIC_OVERVIEW_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import KeyFactors from '@/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors';
import { useBenchmarkingInsight } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingInsight';
import { useKeyFactorsVisibility } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useKeyFactorsVisibility';
import { useTrafficOverviewReports } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useTrafficOverviewReports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

const TrafficOverviewPanel: FC = () => {
	const {
		totalsReport,
		benchmarkingResponse,
		loaded,
		errors,
		retryBenchmarkingData,
	} = useTrafficOverviewReports();

	const canViewSharedAnalytics4 = useCanViewSharedModule(
		MODULE_SLUG_ANALYTICS_4
	);

	const isGatheringData = useInViewSelect< boolean | undefined >(
		( select: Select ) =>
			canViewSharedAnalytics4
				? select( MODULES_ANALYTICS_4 ).isGatheringData()
				: undefined,
		[ canViewSharedAnalytics4 ]
	);

	const { isAvailable: hasKeyFactors, isShown: showKeyFactors } =
		useKeyFactorsVisibility();
	const trafficInsightsEnabled = useFeature( 'trafficInsights' );
	const showInsights = showKeyFactors && trafficInsightsEnabled;

	// The insight arrives after the figures, since the service generates it
	// from them. Without an insight, the panel shows its figures alone.
	const { insight, loading: insightLoading } = useBenchmarkingInsight( {
		isEnabled: showInsights,
	} );

	const { startDate, endDate } = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeDates(),
		[]
	);

	const daysInSelectedRange = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeNumberOfDays(),
		[]
	);

	const referenceSiteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	const isLoading = ! loaded || isGatheringData === undefined;

	// The panel reads the benchmarking response wherever it has the key
	// factors. Each day of the response carries its typical range, which the
	// chart draws behind the line.
	//
	// TODO: Give the chart and the total visits figures of their own without
	// the `typicalTraffic` feature, where the panel reads no benchmarking
	// response.
	const dailyTraffic = hasKeyFactors
		? benchmarkingResponse?.dailyTraffic
		: getPlaceholderDailyTraffic( startDate, endDate );
	const totalVisits = hasKeyFactors
		? benchmarkingResponse?.visits
		: PLACEHOLDER_TOTAL_VISITS;

	return (
		<div
			className="googlesitekit-traffic-overview__panel"
			role="tabpanel"
			aria-labelledby={ TRAFFIC_OVERVIEW_TAB_ID }
		>
			{ errors.length > 0 && (
				<ReportError
					moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
					error={ errors }
					// `ReportError` offers "Retry" for an error of a selector
					// other than `getReport` only with `onRetry`.
					onRetry={ retryBenchmarkingData }
				/>
			) }
			{ errors.length === 0 && (
				<Fragment>
					<div className="googlesitekit-traffic-overview__summary">
						{ showInsights && (
							// The analysis compares the site's traffic with
							// its typical range, which the chart draws wherever
							// the panel shows the key factors.
							<TrafficInsightNotice
								text={ insight?.analysis }
								loading={ insightLoading }
							/>
						) }
						<TotalVisitors
							report={ totalsReport }
							totalVisits={ totalVisits }
							loaded={ ! isLoading }
							gatheringData={ isGatheringData }
						/>
					</div>
					<TrafficChart
						dailyTraffic={ dailyTraffic }
						loaded={ ! isLoading }
						gatheringData={ isGatheringData }
						// TODO: Replace the placeholder published posts with
						// the site's own.
						publishedPosts={
							showKeyFactors
								? getPlaceholderPublishedPosts( dailyTraffic )
								: undefined
						}
					/>
					{ showKeyFactors && (
						<KeyFactors
							keyFactors={
								benchmarkingResponse?.keyFactors ?? []
							}
							loaded={ ! isLoading }
							// The driver describes the change against the
							// previous period, and what carried it.
							insight={ insight?.driver }
							insightLoading={ insightLoading }
							daysInSelectedRange={ daysInSelectedRange }
							referenceSiteURL={ referenceSiteURL }
						/>
					) }
					<TrafficBreakdown
						// TODO: Replace the placeholder breakdown with the
						// site's own.
						values={ PLACEHOLDER_TRAFFIC_BREAKDOWN }
						loaded={ ! isLoading }
						gatheringData={ isGatheringData }
					/>
				</Fragment>
			) }
		</div>
	);
};

export default TrafficOverviewPanel;
