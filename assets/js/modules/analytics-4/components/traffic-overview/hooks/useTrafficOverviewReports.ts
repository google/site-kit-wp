/**
 * Traffic Overview `useTrafficOverviewReports` hook.
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
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	getBreakdownReportOptions,
	getGraphReportOptions,
	getTotalsReportOptions,
} from '@/js/modules/analytics-4/components/dashboard/DashboardAllTrafficWidgetGA4/reportOptions';
import { TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/columns';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { useTrafficReport } from './useTrafficReport';

const [ CHANNELS_COLUMN, LOCATIONS_COLUMN, DEVICES_COLUMN ] =
	TRAFFIC_BREAKDOWN_COLUMNS;

export interface TrafficOverviewReports {
	/**
	 * The report of total visitors over the selected range, against the range
	 * before it.
	 */
	totalsReport?: Report;
	/** The report of visitors per day over the selected range. */
	graphReport?: Report;
	/** One report per breakdown column, keyed by the column's `id`. */
	breakdownReports: Record< string, Report | undefined >;
	/** `true` when all five reports have finished resolving. */
	loaded: boolean;
	/**
	 * The first error among the five reports. If multiple errors exist, the
	 * first in this order is used in the error output shown to users:
	 *
	 * 1. totals
	 * 2. graph
	 * 3. channels
	 * 4. locations
	 * 5. devices
	 *
	 * Should be set to `undefined` when no report has an error.
	 */
	error?: Record< string, unknown >;
}

/**
 * Resolves the five GA4 reports the Traffic Overview panel needs.
 *
 * @since n.e.x.t
 *
 * @return {Object} The five reports, whether they have all finished, and the first error among them.
 */
export function useTrafficOverviewReports(): TrafficOverviewReports {
	const { compareStartDate, compareEndDate } = useSelect(
		( select: Select ) =>
			select( CORE_USER ).getDateRangeDates( { compare: true } ),
		[]
	);

	const totalsReportOptions = useMemo(
		() => getTotalsReportOptions( { compareStartDate, compareEndDate } ),
		[ compareStartDate, compareEndDate ]
	);

	const [
		graphReportOptions,
		channelsReportOptions,
		locationsReportOptions,
		devicesReportOptions,
	] = useMemo(
		() => [
			getGraphReportOptions(),
			getBreakdownReportOptions( CHANNELS_COLUMN ),
			getBreakdownReportOptions( LOCATIONS_COLUMN ),
			getBreakdownReportOptions( DEVICES_COLUMN ),
		],
		[]
	);

	const totals = useTrafficReport( totalsReportOptions );
	const graph = useTrafficReport( graphReportOptions );
	const channels = useTrafficReport( channelsReportOptions );
	const locations = useTrafficReport( locationsReportOptions );
	const devices = useTrafficReport( devicesReportOptions );

	const allArgs = [
		totals.args,
		graph.args,
		channels.args,
		locations.args,
		devices.args,
	];

	const loaded = useSelect(
		( select: Select ) =>
			! select( MODULES_ANALYTICS_4 ).areReportsLoading( ...allArgs ),
		[ totals.args, graph.args, channels.args, locations.args, devices.args ]
	);

	const error = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getFirstReportError( ...allArgs ),
		[ totals.args, graph.args, channels.args, locations.args, devices.args ]
	);

	const breakdownReports = useMemo(
		() => ( {
			[ CHANNELS_COLUMN.id ]: channels.report,
			[ LOCATIONS_COLUMN.id ]: locations.report,
			[ DEVICES_COLUMN.id ]: devices.report,
		} ),
		[ channels.report, locations.report, devices.report ]
	);

	return {
		totalsReport: totals.report,
		graphReport: graph.report,
		breakdownReports,
		loaded,
		error,
	};
}
