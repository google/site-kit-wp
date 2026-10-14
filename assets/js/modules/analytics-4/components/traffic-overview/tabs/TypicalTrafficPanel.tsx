/**
 * Typical Traffic panel.
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
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import TypicalTrafficChart from '@/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart';
import { TYPICAL_TRAFFIC_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { useBenchmarkingData } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingData';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

const TypicalTrafficPanel: FC = () => {
	// TODO: #13601 -- Show the key factors from the response.
	// TODO: #13602 -- Show the loading and error states.
	const { startDate, endDate, response } = useBenchmarkingData();

	const daysInSelectedRange = useSelect(
		( select: Select ) => select( CORE_USER ).getDateRangeNumberOfDays(),
		[]
	);

	const propertyCreateTime = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getPropertyCreateTime(),
		[]
	);

	return (
		<div
			className="googlesitekit-traffic-overview__panel"
			role="tabpanel"
			aria-labelledby={ TYPICAL_TRAFFIC_TAB_ID }
		>
			{ response && (
				<TypicalTrafficChart
					dailyTraffic={ response.dailyTraffic }
					selectedStartDate={ startDate }
					selectedEndDate={ endDate }
					daysInSelectedRange={ daysInSelectedRange }
					propertyCreateTime={ propertyCreateTime }
				/>
			) }
		</div>
	);
};

export default TypicalTrafficPanel;
