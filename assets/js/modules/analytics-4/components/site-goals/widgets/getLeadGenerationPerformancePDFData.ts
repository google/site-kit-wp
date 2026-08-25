/**
 * PDF data loader for the Lead generation performance widget.
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
	SITE_GOALS_LEAD_GENERATION_WIDGET_TITLE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import fetchSiteGoalsPDFReports from './pdf/fetchSiteGoalsPDFReports';
import {
	getLeadAggregatedReportOptions,
	getLeadGroupedReportOptions,
} from './pdf/reportOptions';
import {
	SiteGoalsPDFGroup,
	shapeSiteGoalsPDFData,
} from './pdf/shapeSiteGoalsPDFData';

/** The data the Lead generation performance PDF section renders. */
export interface LeadGenerationPerformancePDFData {
	/** The loaded groups, or `null` when the PDF report leaves the Lead generation performance section out. */
	data: {
		/** The breakdown groups, in the order the Lead generation performance PDF section renders them. */
		groups: SiteGoalsPDFGroup[];
		/** The number of days in the PDF report's date range, for the "Vs. prev. 28 days" caption. */
		dateRangeLength: number;
		/** The lead events the Key action tiles count. */
		leadEvents: string[];
	} | null;
}

/**
 * Loads the groups the Lead generation performance PDF section renders.
 *
 * The section holds one group per form. It adds one more group for the
 * completions that belong to none of them. When no form has completions in the
 * date range, the section falls back to a single group for the whole site.
 *
 * @since n.e.x.t
 *
 * @param {Object}      params          Lead generation performance PDF loader parameters.
 * @param {Object}      params.registry WordPress data registry.
 * @param {Object}      params.dates    The PDF report's date range, with the current day excluded.
 * @param {AbortSignal} params.signal   Signal that cancels the PDF export.
 * @return {Promise<Object>} The loaded groups, or `{ data: null }` when the PDF report leaves the Lead generation performance section out.
 */
export default async function getLeadGenerationPerformancePDFData( {
	registry,
	dates,
	signal,
}: GetPDFDataParams ): Promise< LeadGenerationPerformancePDFData > {
	if ( signal.aborted ) {
		return { data: null };
	}

	await registry.resolveSelect( MODULES_ANALYTICS_4 ).getSettings();

	if ( signal.aborted ) {
		return { data: null };
	}

	const leadEvents: string[] =
		registry.select( MODULES_ANALYTICS_4 ).getDetectedLeadEvents() || [];

	const groupedReportOptions = getLeadGroupedReportOptions(
		dates,
		leadEvents
	);
	const aggregatedReportOptions = getLeadAggregatedReportOptions(
		dates,
		leadEvents
	);

	if ( ! groupedReportOptions || ! aggregatedReportOptions ) {
		return { data: null };
	}

	const breakdownValues: string[] =
		( await registry
			.resolveSelect( MODULES_ANALYTICS_4 )
			.getBreakdownValues(
				SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[
					GOAL_TYPES.LEAD
				],
				[]
			) ) || [];

	if ( signal.aborted ) {
		return { data: null };
	}

	await registry
		.resolveSelect( MODULES_ANALYTICS_4 )
		.getFormMetadata( breakdownValues );

	if ( signal.aborted ) {
		return { data: null };
	}

	const formTitles: Record< string, string > =
		registry
			.select( MODULES_ANALYTICS_4 )
			.getFormTitles( breakdownValues ) || {};

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
		breakdownValues,
		labels: formTitles,
		aggregatedLabel: SITE_GOALS_LEAD_GENERATION_WIDGET_TITLE,
	} );

	// With no group the Lead generation performance section has nothing to show.
	// `data: null` keeps the section out of the PDF report rather than filling
	// it with a placeholder.
	if ( groups.length === 0 ) {
		return { data: null };
	}

	const dateRangeLength: number = registry
		.select( CORE_USER )
		.getDateRangeNumberOfDays();

	return { data: { groups, dateRangeLength, leadEvents } };
}
