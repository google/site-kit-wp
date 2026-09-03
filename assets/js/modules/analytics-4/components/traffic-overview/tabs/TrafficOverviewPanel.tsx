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
 * Internal dependencies
 */
import TrafficBreakdown from '@/js/modules/analytics-4/components/traffic-overview/breakdown/TrafficBreakdown';
import TrafficChart from '@/js/modules/analytics-4/components/traffic-overview/charts/TrafficChart';
import TotalVisitors from '@/js/modules/analytics-4/components/traffic-overview/components/TotalVisitors';
import { TRAFFIC_OVERVIEW_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { useTrafficOverviewReports } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useTrafficOverviewReports';

const TrafficOverviewPanel: FC = () => {
	// `TotalVisitors` and `TrafficChart` are still placeholders, so only the
	// breakdown reports are read here.
	const { breakdownReports } = useTrafficOverviewReports();

	return (
		<div
			className="googlesitekit-traffic-overview__panel"
			role="tabpanel"
			aria-labelledby={ TRAFFIC_OVERVIEW_TAB_ID }
		>
			<TotalVisitors />
			<TrafficChart />
			<TrafficBreakdown reports={ breakdownReports } />
		</div>
	);
};

export default TrafficOverviewPanel;
