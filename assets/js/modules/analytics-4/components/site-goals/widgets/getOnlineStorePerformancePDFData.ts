/**
 * PDF data loader for the Online store performance widget.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDERS,
	SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDER_LABELS,
	SITE_GOALS_ONLINE_STORE_WIDGET_TITLE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { EcommerceKeyActionEvent } from '@/js/modules/analytics-4/components/site-goals/utils/keyActionText';
import {
	CONVERSION_REPORTING_ECOMMERCE_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import fetchSiteGoalsPDFReports from './pdf/fetchSiteGoalsPDFReports';
import {
	getStoreAggregatedReportOptions,
	getStoreGroupedReportOptions,
} from './pdf/reportOptions';
import {
	SiteGoalsPDFGroup,
	shapeSiteGoalsPDFData,
} from './pdf/shapeSiteGoalsPDFData';

/** The data the Online store performance PDF section renders. */
export interface OnlineStorePerformancePDFData {
	/** The loaded groups, or `null` when the PDF report leaves the Online store performance section out. */
	data: {
		/** The breakdown groups, in the order the Online store performance PDF section renders them. */
		groups: SiteGoalsPDFGroup[];
		/** The number of days in the PDF report's date range, for the "Vs. prev. 28 days" caption. */
		dateRangeLength: number;
		/** The ecommerce event the Key action tiles count. */
		primaryEvent: EcommerceKeyActionEvent;
	} | null;
}

/**
 * Loads the groups the Online store performance PDF section renders.
 *
 * The section holds one group per supported ecommerce plugin. It adds one more
 * group for the sales that came from none of them. When no supported plugin has
 * sales in the date range, the section falls back to a single group for the
 * whole site.
 *
 * @since n.e.x.t
 *
 * @param {Object}      params          Online store performance PDF loader parameters.
 * @param {Object}      params.registry WordPress data registry.
 * @param {Object}      params.dates    The PDF report's date range, with the current day excluded.
 * @param {AbortSignal} params.signal   Signal that cancels the PDF export.
 * @return {Promise<Object>} The loaded groups, or `{ data: null }` when the PDF report leaves the Online store performance section out.
 */
export default async function getOnlineStorePerformancePDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< OnlineStorePerformancePDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	await registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings();

	if ( signal.aborted ) {
		return { data: null };
	}

	const primaryEvent: EcommerceKeyActionEvent | undefined = registry
		.select( MODULES_ANALYTICS_4 )
		.getPrimaryEcommerceEvent();

	const groupedReportOptions = getStoreGroupedReportOptions(
		dates,
		primaryEvent
	);
	const aggregatedReportOptions = getStoreAggregatedReportOptions(
		dates,
		primaryEvent
	);

	// `! primaryEvent` changes nothing at runtime, and TypeScript needs it to
	// know the event is set in the data returned below.
	if (
		! primaryEvent ||
		! groupedReportOptions ||
		! aggregatedReportOptions
	) {
		return { data: null };
	}

	const breakdownValues: string[] =
		( await registry
			.resolveSelect( MODULES_ANALYTICS_4 )
			.getBreakdownValues(
				SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[
					GOAL_TYPES.ECOMMERCE
				],
				CONVERSION_REPORTING_ECOMMERCE_EVENTS
			) ) || [];

	if ( signal.aborted ) {
		return { data: null };
	}

	const reports = await fetchSiteGoalsPDFReports( {
		registry,
		signal,
		groupedReportOptions,
		aggregatedReportOptions,
	} );

	if ( signal.aborted ) {
		return { data: null };
	}

	const groups = shapeSiteGoalsPDFData( {
		...reports,
		// The dashboard gives a tab only to a supported ecommerce plugin. The
		// "Other sources" group holds every other value the provider dimension
		// carries, on the dashboard and in the PDF report.
		breakdownValues: breakdownValues.filter( ( value ) =>
			SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDERS.includes( value )
		),
		labels: SITE_GOALS_BREAKDOWN_ECOMMERCE_PROVIDER_LABELS,
		aggregatedLabel: SITE_GOALS_ONLINE_STORE_WIDGET_TITLE,
	} );

	// With no group the Online store performance section has nothing to show,
	// so `data: null` keeps it out of the PDF report.
	if ( groups.length === 0 ) {
		return { data: null };
	}

	const dateRangeLength: number = registry
		.select( CORE_USER )
		.getDateRangeNumberOfDays();

	return { data: { groups, dateRangeLength, primaryEvent } };
}
