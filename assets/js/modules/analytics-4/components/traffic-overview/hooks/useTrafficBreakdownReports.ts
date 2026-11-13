/**
 * Traffic Overview `useTrafficBreakdownReports` hook.
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
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/columns';
import { getBreakdownReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { TrafficBreakdownValue } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { getBreakdownValuesFromReport } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownValuesFromReport';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { useTrafficReport } from './useTrafficReport';

const [ CHANNELS_COLUMN, LOCATIONS_COLUMN, DEVICES_COLUMN ] =
	TRAFFIC_BREAKDOWN_COLUMNS;

// Built once, so each report keeps the same options from render to render.
const CHANNELS_REPORT_OPTIONS = getBreakdownReportOptions( CHANNELS_COLUMN );
const LOCATIONS_REPORT_OPTIONS = getBreakdownReportOptions( LOCATIONS_COLUMN );
const DEVICES_REPORT_OPTIONS = getBreakdownReportOptions( DEVICES_COLUMN );

export interface TrafficBreakdownReports {
	/**
	 * The values of each breakdown column, keyed by the column's `id`, each
	 * ordered by visits, most first. A column's values are empty until its
	 * report arrives.
	 */
	values: Record< string, TrafficBreakdownValue[] >;
	/**
	 * The arguments this hook passes to the `getReport` selector for the
	 * channels, locations, and devices reports, in that order. The panel's
	 * reports hook reads their loading state and their errors under the same
	 * arguments.
	 */
	args: ReportOptions[];
}

/**
 * Resolves the three GA4 reports of the Traffic Overview breakdown. Each
 * report counts the visits of each value of its column's dimension over the
 * selected range.
 *
 * `useTrafficReport` adds the selected date range to each report, and the
 * entity URL on an entity dashboard, so the breakdown covers the page alone
 * there.
 *
 * @since n.e.x.t
 *
 * @return {Object} The values of each column, and the arguments of the three reports.
 */
export function useTrafficBreakdownReports(): TrafficBreakdownReports {
	const channels = useTrafficReport( CHANNELS_REPORT_OPTIONS );
	const locations = useTrafficReport( LOCATIONS_REPORT_OPTIONS );
	const devices = useTrafficReport( DEVICES_REPORT_OPTIONS );

	const values = useMemo(
		() => ( {
			[ CHANNELS_COLUMN.id ]: getBreakdownValuesFromReport(
				channels.report
			),
			[ LOCATIONS_COLUMN.id ]: getBreakdownValuesFromReport(
				locations.report
			),
			[ DEVICES_COLUMN.id ]: getBreakdownValuesFromReport(
				devices.report
			),
		} ),
		[ channels.report, locations.report, devices.report ]
	);

	const args = useMemo(
		() => [ channels.args, locations.args, devices.args ],
		[ channels.args, locations.args, devices.args ]
	);

	return { values, args };
}
