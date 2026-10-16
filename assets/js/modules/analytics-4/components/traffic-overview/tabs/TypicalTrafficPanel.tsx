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
import { TYPICAL_TRAFFIC_TAB_ID } from '@/js/modules/analytics-4/components/traffic-overview/constants';
import { useBenchmarkingData } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useBenchmarkingData';

const TypicalTrafficPanel: FC = () => {
	// TODO: #13600 -- Show the response in the chart, and in the key factors from
	// #13601, with the loading and error states from #13602.
	useBenchmarkingData();

	return (
		<div
			className="googlesitekit-traffic-overview__panel"
			role="tabpanel"
			aria-labelledby={ TYPICAL_TRAFFIC_TAB_ID }
		/>
	);
};

export default TypicalTrafficPanel;
