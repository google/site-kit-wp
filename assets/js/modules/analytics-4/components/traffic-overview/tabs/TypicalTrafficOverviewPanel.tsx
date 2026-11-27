/**
 * Typical Traffic Overview panel.
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
import useCanViewSharedModule from '@/js/hooks/useCanViewSharedModule';
import { useFeature } from '@/js/hooks/useFeature';
import TypicalTrafficBreakdown from '@/js/modules/analytics-4/components/traffic-overview/breakdown/TypicalTrafficBreakdown';
import { getPublishedPosts } from '@/js/modules/analytics-4/components/traffic-overview/charts/getPublishedPosts';
import TypicalTrafficChart from '@/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart';
import TrafficInsightNotice from '@/js/modules/analytics-4/components/traffic-overview/components/TrafficInsightNotice';
import TrafficInsightResetNotice from '@/js/modules/analytics-4/components/traffic-overview/components/TrafficInsightResetNotice';
import TypicalTotalVisitors from '@/js/modules/analytics-4/components/traffic-overview/components/TypicalTotalVisitors';
import TypicalTrafficAvailabilityNotice from '@/js/modules/analytics-4/components/traffic-overview/components/TypicalTrafficAvailabilityNotice';
import { TRAFFIC_OVERVIEW_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import KeyFactors from '@/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors';
import { useBenchmarkingInsight } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingInsight';
import { useKeyFactorsVisibility } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useKeyFactorsVisibility';
import { useTypicalTrafficDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useTypicalTrafficDateRange';
import { useTypicalTrafficOverviewReports } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useTypicalTrafficOverviewReports';
import {
	getTrafficOverviewVisits,
	getTypicalTrafficAvailability,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

const TypicalTrafficOverviewPanel: FC = () => {
	const {
		totalsReport,
		dailyVisitsReport,
		breakdownValues,
		benchmarkingResponse,
		benchmarkingError,
		loaded,
		errors,
		retryBenchmarkingData,
	} = useTypicalTrafficOverviewReports();

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

	const { isShown: isKeyFactorsShown } = useKeyFactorsVisibility();
	const trafficInsightsEnabled = useFeature( 'trafficInsights' );

	// A failed benchmarking request takes only the parts that the response
	// alone has: the band, the published posts, the key factors and the
	// insight. The panel still shows its figures, from the daily visits
	// report, and the breakdown, with the request's error in place of the key
	// factors.
	const showKeyFactors = isKeyFactorsShown && ! benchmarkingError;
	const showInsights = showKeyFactors && trafficInsightsEnabled;

	// The typical traffic view ends its ranges on the last full day.
	const {
		startDate,
		endDate,
		days: daysInSelectedRange,
	} = useTypicalTrafficDateRange();

	const referenceSiteURL = useSelect(
		( select: Select ) => select( CORE_SITE ).getReferenceSiteURL(),
		[]
	);

	// Which parts of the typical traffic view the selected range has, by the
	// rules of the Site Kit service. Until the benchmarking response arrives,
	// the panel keeps the placeholders of every part.
	//
	// A part the site's history is too short for says when it will show, as
	// the scenarios doc agreed (D13): the response has the last day of the
	// first range of this length with each part.
	//
	// - The band needs a typical range under every day, and the analysis,
	//   which compares the visits with it, needs the band.
	// - The key factors compare the selected range with the period before it,
	//   so the response has none until every day of that period has recorded
	//   traffic, and none for a range too short for them. Until then, their
	//   section is left out, rather than saying that no channel changed
	//   notably, and the panel asks for no insight, whose driver would
	//   describe a change against days that weren't measured.
	// - The Site Kit service writes the insight for a range of up to 364
	//   days, so the panel asks for none for a longer range.
	// - A site with too little traffic has no band, no key factors and no
	//   insight, however long its history: the response has none of them,
	//   and the chart keeps its line and the published posts.
	//
	// One notice, in the analysis's place, says what the range lacks and when
	// each waiting part will show, so notices about the parts never stack. For
	// a site with low traffic, it is a warning that says why the parts are
	// missing.
	const availability = getTypicalTrafficAvailability( benchmarkingResponse );
	const {
		keyFactorsAvailable,
		insightRequestAllowed,
		performanceInsightAvailable,
		lastYearAvailable,
	} = availability;

	// The insight arrives after the figures, since the service generates it
	// from them. Without an insight, the panel shows its figures alone.
	const {
		insight,
		loading: insightLoading,
		siteNotFound,
	} = useBenchmarkingInsight( {
		isEnabled: showInsights && insightRequestAllowed,
	} );

	const isLoading = ! loaded || isGatheringData === undefined;

	// The panel reads its figures from the benchmarking response, and from the
	// daily visits report when the benchmarking request fails.
	const { dailyTraffic, totalVisits } = getTrafficOverviewVisits( {
		benchmarkingResponse,
		benchmarkingFailed: !! benchmarkingError,
		dailyVisitsReport,
		startDate,
		endDate,
	} );

	return (
		<div
			className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--typical-traffic"
			role="tabpanel"
			aria-labelledby={ TRAFFIC_OVERVIEW_TAB_ID }
		>
			{ errors.length > 0 ? (
				<ReportError
					moduleSlug={ MODULE_SLUG_ANALYTICS_4 }
					error={ errors }
					// `ReportError` offers "Retry" for an error of a selector
					// other than `getReport` only with `onRetry`.
					onRetry={ retryBenchmarkingData }
				/>
			) : (
				<Fragment>
					<div className="googlesitekit-traffic-overview__summary">
						<TrafficInsightResetNotice
							// When the service has no record of the site,
							// neither insight comes until Site Kit is reset
							// and set up again.
							siteNotFound={ siteNotFound }
						/>
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
						{ showKeyFactors && (
							// In the analysis's place, whatever the range
							// lacks: a part that waits for history, or a
							// length the key factors or the insight need.
							<TypicalTrafficAvailabilityNotice
								availability={ availability }
								insightsEnabled={ trafficInsightsEnabled }
								loaded={ ! isLoading }
							/>
						) }
						<TypicalTotalVisitors
							report={ totalsReport }
							totalVisits={ totalVisits }
							loaded={ ! isLoading }
							gatheringData={ isGatheringData }
						/>
					</div>
					<TypicalTrafficChart
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
					{ showKeyFactors && ( isLoading || keyFactorsAvailable ) && (
						// The section keeps its placeholders until the
						// figures arrive, so the sections arrive together. A
						// range without key factors then leaves it out, and
						// the notice above the figures says why.
						<KeyFactors
							keyFactors={ benchmarkingResponse?.keyFactors }
							steady={ benchmarkingResponse?.steadyTraffic }
							loaded={ ! isLoading }
							// The driver describes the change against the
							// previous period, and what carried it.
							insight={ insight?.driver }
							insightLoading={ insightLoading }
							daysInSelectedRange={ daysInSelectedRange }
							referenceSiteURL={ referenceSiteURL }
						/>
					) }
					<TypicalTrafficBreakdown
						values={ breakdownValues }
						loaded={ ! isLoading }
						gatheringData={ isGatheringData }
					/>
				</Fragment>
			) }
		</div>
	);
};

export default TypicalTrafficOverviewPanel;
