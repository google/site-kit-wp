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
import { TYPICAL_TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/typicalColumns';
import { getTypicalBreakdownReportOptions } from '@/js/modules/analytics-4/components/traffic-overview/typicalReportOptions';
import {
	TrafficBreakdownValue,
	getBreakdownValuesFromReport,
} from '@/js/modules/analytics-4/components/traffic-overview/utils';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { useTrafficReport } from './useTrafficReport';
import { useTypicalTrafficDateRange } from './useTypicalTrafficDateRange';

const [ CHANNELS_COLUMN, LOCATIONS_COLUMN, DEVICES_COLUMN ] =
	TYPICAL_TRAFFIC_BREAKDOWN_COLUMNS;

// Built once, so each report keeps the same options from render to render.
const CHANNELS_REPORT_OPTIONS =
	getTypicalBreakdownReportOptions( CHANNELS_COLUMN );
const LOCATIONS_REPORT_OPTIONS =
	getTypicalBreakdownReportOptions( LOCATIONS_COLUMN );
const DEVICES_REPORT_OPTIONS =
	getTypicalBreakdownReportOptions( DEVICES_COLUMN );

/**
 * Adds the typical traffic view's date range to a report's options.
 *
 * @since n.e.x.t
 *
 * @param {Object} reportOptions The report's options.
 * @param {string} startDate     The first day of the range.
 * @param {string} endDate       The last day of the range.
 * @return {Object} The report's options with the range.
 */
function withDates(
	reportOptions: Partial< ReportOptions >,
	startDate: string,
	endDate: string
): Partial< ReportOptions > {
	return { ...reportOptions, startDate, endDate };
}

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
 * Resolves the three GA4 reports of the Typical Traffic Overview breakdown.
 * Each report counts the visits of each value of its column's dimension over
 * the selected range.
 *
 * Each report covers the selected date range as the typical traffic view
 * reads it, ending on the last full day. `useTrafficReport` adds the entity
 * URL on an entity dashboard, so the breakdown covers the page alone there.
 *
 * @since n.e.x.t
 *
 * @return {Object} The values of each column, and the arguments of the three reports.
 */
export function useTrafficBreakdownReports(): TrafficBreakdownReports {
	const { startDate, endDate } = useTypicalTrafficDateRange();

	const reportOptions = useMemo(
		() => ( {
			channels: withDates( CHANNELS_REPORT_OPTIONS, startDate, endDate ),
			locations: withDates(
				LOCATIONS_REPORT_OPTIONS,
				startDate,
				endDate
			),
			devices: withDates( DEVICES_REPORT_OPTIONS, startDate, endDate ),
		} ),
		[ startDate, endDate ]
	);

	const channels = useTrafficReport( reportOptions.channels );
	const locations = useTrafficReport( reportOptions.locations );
	const devices = useTrafficReport( reportOptions.devices );

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
