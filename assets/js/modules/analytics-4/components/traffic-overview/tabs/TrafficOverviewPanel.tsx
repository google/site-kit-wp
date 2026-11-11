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
	getPlaceholderTypicalTrafficRange,
} from '@/js/modules/analytics-4/components/traffic-overview/charts/placeholderTrafficChartData';
import TrafficChart from '@/js/modules/analytics-4/components/traffic-overview/charts/TrafficChart';
import { PLACEHOLDER_TOTAL_VISITS } from '@/js/modules/analytics-4/components/traffic-overview/components/placeholderTotalVisits';
import { PLACEHOLDER_TRAFFIC_INSIGHT } from '@/js/modules/analytics-4/components/traffic-overview/components/placeholderTrafficInsight';
import TotalVisitors from '@/js/modules/analytics-4/components/traffic-overview/components/TotalVisitors';
import TrafficInsightNotice from '@/js/modules/analytics-4/components/traffic-overview/components/TrafficInsightNotice';
import { TRAFFIC_OVERVIEW_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import KeyFactors from '@/js/modules/analytics-4/components/traffic-overview/factors/KeyFactors';
import {
	PLACEHOLDER_KEY_FACTORS,
	PLACEHOLDER_KEY_FACTORS_INSIGHT,
} from '@/js/modules/analytics-4/components/traffic-overview/factors/placeholderKeyFactors';
import { useKeyFactorsVisibility } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useKeyFactorsVisibility';
import { useTrafficOverviewReports } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useTrafficOverviewReports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

const TrafficOverviewPanel: FC = () => {
	const { totalsReport, loaded, errors } = useTrafficOverviewReports();

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

	const { isShown: showKeyFactors } = useKeyFactorsVisibility();
	const trafficInsightsEnabled = useFeature( 'trafficInsights' );

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

	// TODO: Read the visits on each day from the benchmarking response.
	const dailyTraffic = getPlaceholderDailyTraffic( startDate, endDate );

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
				/>
			) }
			{ errors.length === 0 && (
				<Fragment>
					<div className="googlesitekit-traffic-overview__summary">
						{ showKeyFactors && trafficInsightsEnabled && (
							// The insight compares the site's traffic with its
							// typical range, which the chart draws wherever the
							// panel shows the key factors.
							//
							// TODO: Read the sentence from the generated insight.
							<TrafficInsightNotice
								text={ PLACEHOLDER_TRAFFIC_INSIGHT }
							/>
						) }
						<TotalVisitors
							report={ totalsReport }
							// TODO: Read the total visits from the benchmarking
							// response.
							totalVisits={ PLACEHOLDER_TOTAL_VISITS }
							loaded={ ! isLoading }
							gatheringData={ isGatheringData }
						/>
					</div>
					<TrafficChart
						dailyTraffic={ dailyTraffic }
						loaded={ ! isLoading }
						gatheringData={ isGatheringData }
						// The chart compares the site with its typical traffic
						// wherever the panel shows the key factors.
						//
						// TODO: Replace the placeholder typical traffic range
						// and published posts with the site's own.
						typicalTrafficRange={
							showKeyFactors
								? getPlaceholderTypicalTrafficRange(
										dailyTraffic
								  )
								: undefined
						}
						publishedPosts={
							showKeyFactors
								? getPlaceholderPublishedPosts( dailyTraffic )
								: undefined
						}
					/>
					{ showKeyFactors && (
						// TODO: Read the key factors and whether they have
						// arrived from the benchmarking response, and their
						// summary from the generated insight.
						<KeyFactors
							keyFactors={ PLACEHOLDER_KEY_FACTORS }
							loaded={ ! isLoading }
							insight={
								trafficInsightsEnabled
									? PLACEHOLDER_KEY_FACTORS_INSIGHT
									: undefined
							}
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
