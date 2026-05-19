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
import { getGraphReportArgs, getTotalsReportArgs } from './reportOptions';

interface PDFDates {
	startDate: string;
	endDate: string;
	compareStartDate: string;
	compareEndDate: string;
}

interface GetPDFDataParams {
	registry: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry selectors are loosely typed in this codebase.
		resolveSelect: ( storeName: string ) => any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Registry selectors are loosely typed in this codebase.
		select: ( storeName: string ) => any;
	};
	dates: PDFDates;
	signal: AbortSignal;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- GA4 reports are returned untyped by the datastore.
type Report = any;

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
 * registry, short-circuiting between awaits if the supplied signal is aborted.
 * The chart rasterisation step is intentionally not implemented here, it lands
 * alongside the line chart fill-in via a follow-up ticket.
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

	const [ totalsReport, graphReport ] = await Promise.all( [
		registry.resolveSelect( MODULES_ANALYTICS_4 ).getReport( totalsArgs ),
		registry.resolveSelect( MODULES_ANALYTICS_4 ).getReport( graphArgs ),
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
