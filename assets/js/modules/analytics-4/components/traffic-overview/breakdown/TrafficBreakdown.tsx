/**
 * Traffic Overview breakdown.
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
import { TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/columns';
import { getBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import TrafficBreakdownColumn from './TrafficBreakdownColumn';

export interface TrafficBreakdownProps {
	/** One report per breakdown column, keyed by the column's `id`. */
	reports: Record< string, Report | undefined >;
}

const TrafficBreakdown: FC< TrafficBreakdownProps > = ( { reports } ) => {
	return (
		<div className="googlesitekit-traffic-overview__breakdown">
			{ TRAFFIC_BREAKDOWN_COLUMNS.map( ( { id, heading } ) => (
				<TrafficBreakdownColumn
					key={ id }
					heading={ heading }
					rows={ getBreakdownRows( reports[ id ] ) }
				/>
			) ) }
		</div>
	);
};

export default TrafficBreakdown;
