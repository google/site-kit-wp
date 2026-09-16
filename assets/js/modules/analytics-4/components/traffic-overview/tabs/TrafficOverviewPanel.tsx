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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import TrafficBreakdown from '@/js/modules/analytics-4/components/traffic-overview/breakdown/TrafficBreakdown';
import TrafficChart from '@/js/modules/analytics-4/components/traffic-overview/charts/TrafficChart';
import TotalVisitors from '@/js/modules/analytics-4/components/traffic-overview/components/TotalVisitors';
import { TRAFFIC_OVERVIEW_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { useTrafficOverviewReports } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useTrafficOverviewReports';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

const TrafficOverviewPanel: FC = () => {
	const viewOnly = useViewOnly();

	const { totalsReport, graphReport, breakdownReports, loaded, errors } =
		useTrafficOverviewReports();

	const canViewSharedAnalytics4 = useSelect(
		( select: Select ) => {
			if ( ! viewOnly ) {
				return true;
			}

			return select( CORE_USER ).canViewSharedModule(
				MODULE_SLUG_ANALYTICS_4
			);
		},
		[ viewOnly ]
	);

	const isGatheringData = useInViewSelect< boolean | undefined >(
		( select: Select ) =>
			canViewSharedAnalytics4
				? select( MODULES_ANALYTICS_4 ).isGatheringData()
				: undefined,
		[ canViewSharedAnalytics4 ]
	);

	const isLoading = ! loaded || isGatheringData === undefined;

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
					<TotalVisitors
						report={ totalsReport }
						loaded={ ! isLoading }
						gatheringData={ isGatheringData }
					/>
					<TrafficChart
						report={ graphReport }
						loaded={ ! isLoading }
						gatheringData={ isGatheringData }
					/>
					<TrafficBreakdown
						reports={ breakdownReports }
						loaded={ ! isLoading }
						gatheringData={ isGatheringData }
					/>
				</Fragment>
			) }
		</div>
	);
};

export default TrafficOverviewPanel;
