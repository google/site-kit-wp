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
import TrafficBreakdown from '@/js/modules/analytics-4/components/traffic-overview/breakdown/TrafficBreakdown';
import { getPublishedPosts } from '@/js/modules/analytics-4/components/traffic-overview/charts/getPublishedPosts';
import TrafficChart from '@/js/modules/analytics-4/components/traffic-overview/charts/TrafficChart';
import TotalVisitors from '@/js/modules/analytics-4/components/traffic-overview/components/TotalVisitors';
import TrafficInsightNotice from '@/js/modules/analytics-4/components/traffic-overview/components/TrafficInsightNotice';
import { TRAFFIC_OVERVIEW_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import KeyFactors from '@/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors';
import { useBenchmarkingInsight } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingInsight';
import { useKeyFactorsVisibility } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useKeyFactorsVisibility';
import { useTrafficOverviewReports } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useTrafficOverviewReports';
import { getTrafficOverviewVisits } from '@/js/modules/analytics-4/components/traffic-overview/utils/getTrafficOverviewVisits';
import { getTypicalTrafficAvailability } from '@/js/modules/analytics-4/components/traffic-overview/utils/getTypicalTrafficAvailability';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

const TrafficOverviewPanel: FC = () => {
	const {
		totalsReport,
		dailyVisitsReport,
		breakdownValues,
		benchmarkingResponse,
		benchmarkingError,
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

	const { isAvailable: hasKeyFactors, isShown: isKeyFactorsShown } =
		useKeyFactorsVisibility();
	const trafficInsightsEnabled = useFeature( 'trafficInsights' );

	// A failed benchmarking request takes only the parts that the response
	// alone has: the band, the published posts, the key factors and the
	// insight. The panel still shows its figures, from the daily visits
	// report, and the breakdown, with the request's error in place of the key
	// factors.
	const showKeyFactors = isKeyFactorsShown && ! benchmarkingError;
	const showInsights = showKeyFactors && trafficInsightsEnabled;

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

	// Which parts of the typical traffic view the selected range has, by the
	// rules of the Site Kit service. Until the benchmarking response arrives,
	// the panel keeps the placeholders of every part.
	//
	// The key factors compare the selected range with the period before it,
	// so the benchmarking response has none until every day of that period
	// has recorded traffic. Until then, the panel leaves out their section,
	// whose notice would say that no channel changed notably, and asks for no
	// insight, whose driver would describe a change against days that weren't
	// measured. A range too short for the key factors has none either, and
	// their section says what range they need instead.
	const {
		rangeTooShort,
		keyFactorsAvailable,
		insightRequestAllowed,
		performanceInsightAvailable,
		lastYearAvailable,
	} = getTypicalTrafficAvailability( benchmarkingResponse );

	// The insight arrives after the figures, since the service generates it
	// from them. Without an insight, the panel shows its figures alone.
	const { insight, loading: insightLoading } = useBenchmarkingInsight( {
		isEnabled: showInsights && insightRequestAllowed,
	} );

	const isLoading = ! loaded || isGatheringData === undefined;

	// The panel reads the benchmarking response wherever it has the key
	// factors, and the daily visits report when the benchmarking request
	// fails.
	const { dailyTraffic, totalVisits } = getTrafficOverviewVisits( {
		readsBenchmarkingResponse: hasKeyFactors,
		benchmarkingResponse,
		benchmarkingFailed: !! benchmarkingError,
		dailyVisitsReport,
		startDate,
		endDate,
	} );

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
						{ showInsights && performanceInsightAvailable && (
							// The analysis compares the site's traffic with
							// its typical range, so it shows only where the
							// chart draws the band. Without it, the service
							// would only say it's still learning what's usual
							// for the site.
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
						// The posts published in the range that brought it the
						// most visits, as the benchmarking response ranks them.
						publishedPosts={
							showKeyFactors
								? getPublishedPosts(
										benchmarkingResponse?.contentMarkers,
										referenceSiteURL
								  )
								: undefined
						}
						// The band's tooltip says how much of the site's
						// traffic the band is based on, and mentions last
						// year only once the history reaches it.
						bandReferenceDays={
							benchmarkingResponse?.bandReferenceDays
						}
						lastYearAvailable={ lastYearAvailable }
					/>
					{ ! isLoading && benchmarkingError && (
						// The error shows once the figures do, so the
						// sections around it don't move when it arrives.
						<div className="googlesitekit-traffic-overview__benchmarking-error">
							<ReportError
								moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
								error={ benchmarkingError }
								onRetry={ retryBenchmarkingData }
							/>
						</div>
					) }
					{ showKeyFactors &&
						( keyFactorsAvailable || rangeTooShort ) && (
							<KeyFactors
								keyFactors={ benchmarkingResponse?.keyFactors }
								steady={ benchmarkingResponse?.steadyTraffic }
								rangeTooShort={ rangeTooShort }
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
						values={ breakdownValues }
						loaded={ ! isLoading }
						gatheringData={ isGatheringData }
					/>
				</Fragment>
			) }
		</div>
	);
};

export default TrafficOverviewPanel;
