/**
 * DashboardAllTrafficWidgetGA4 PDF data loader.
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
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import type {
	Report,
	ReportOptions,
} from '@/js/modules/analytics-4/datastore/types';
import { getGraphReportArgs, getTotalsReportArgs } from './reportOptions';

export interface GetPDFDataParams {
	registry: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry actions are loosely typed in this codebase.
		dispatch: ( storeName: string ) => any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry selectors are loosely typed in this codebase.
		resolveSelect: ( storeName: string ) => any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry selectors are loosely typed in this codebase.
		select: ( storeName: string ) => any;
	};
	dates: Pick<
		ReportOptions,
		'startDate' | 'endDate' | 'compareStartDate' | 'compareEndDate'
	>;
	signal: AbortSignal;
}

export interface AllTrafficPDFData {
	data: {
		totalsReport: Report;
		graphReport: Report;
	} | null;
}

/**
 * Loads the GA4 reports needed by the All Visitors PDF widget.
 *
 * Resolves the totals and date-dimension graph reports in parallel via the
 * registry, stopping early between awaits when the supplied signal is
 * aborted. Forwards the signal to each report request, so cancelling the
 * export also stops any request that is still running. Invalidates the
 * resolutions left by earlier runs, so a rerun after a cancelled or failed
 * export fetches the reports again. The chart rasterisation step is
 * intentionally not implemented here, it lands alongside the line chart
 * fill-in via a follow-up ticket.
 *
 * @since n.e.x.t
 *
 * @param {Object}      params          Loader parameters.
 * @param {Object}      params.registry WordPress data registry.
 * @param {Object}      params.dates    Report date range.
 * @param {AbortSignal} params.signal   Cancellation signal.
 * @return {Promise<Object>} Resolved report data.
 */
export default async function getPDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< AllTrafficPDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	const { startDate, endDate, compareStartDate, compareEndDate } = dates;

	const url = registry.select( CORE_SITE ).getCurrentEntityURL() || undefined;

	const totalsArgs = getTotalsReportArgs( {
		startDate,
		endDate,
		compareStartDate,
		compareEndDate,
		url,
	} );

	const graphArgs = getGraphReportArgs( {
		startDate,
		endDate,
		url,
	} );

	// The registry remembers each `getReport` call by its arguments, and
	// every abort signal looks the same to it. After a cancelled or failed
	// run, the registry would treat the calls below as already done and
	// return `undefined` reports without fetching. Invalidate the earlier
	// calls, so this run fetches the reports again. A report that already
	// loaded stays in state, so a successful earlier run adds no extra
	// request.
	const { invalidateResolution } = registry.dispatch( MODULES_ANALYTICS_4 );
	invalidateResolution( 'getReport', [ totalsArgs, { signal } ] );
	invalidateResolution( 'getReport', [ graphArgs, { signal } ] );

	const [ totalsReport, graphReport ] = await Promise.all( [
		registry
			.resolveSelect( MODULES_ANALYTICS_4 )
			.getReport( totalsArgs, { signal } ),
		registry
			.resolveSelect( MODULES_ANALYTICS_4 )
			.getReport( graphArgs, { signal } ),
	] );

	if ( signal.aborted ) {
		return { data: null };
	}

	return {
		data: {
			totalsReport,
			graphReport,
		},
	};
}
