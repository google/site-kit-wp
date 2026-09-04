/**
 * Site Goals PDF test fixtures.
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
import type { SiteGoalsPDFGroup } from '@/js/modules/analytics-4/components/site-goals/widgets/pdf/shapeSiteGoalsPDFData';
import {
	SiteGoalsPDFReportFixtures,
	buildAggregatedTotalsRows,
	buildBreakdownReportRows,
} from '@/js/modules/analytics-4/components/site-goals/widgets/pdf/test-utils';

/**
 * The Analytics reports an Online store performance PDF loader test reads.
 *
 * The discovery report holds one provider the widget does not support, and the
 * grouped events report holds a row with no provider, so a test can check the
 * "Other sources" group.
 */
export const ONLINE_STORE_PDF_REPORT_FIXTURES: SiteGoalsPDFReportFixtures = {
	discoveryReport: {
		rows: [ 'woocommerce', 'easy-digital-downloads', 'shopify' ].map(
			( value ) => ( {
				dimensionValues: [ { value } ],
				metricValues: [ { value: '45' } ],
			} )
		),
	},
	groupedEventsReport: {
		rows: [
			...buildBreakdownReportRows( 'woocommerce', [ '85' ], [ '76' ] ),
			...buildBreakdownReportRows(
				'easy-digital-downloads',
				[ '20' ],
				[ '25' ]
			),
			...buildBreakdownReportRows( 'shopify', [ '9' ], [ '6' ] ),
			...buildBreakdownReportRows( '(not set)', [ '7' ], [ '4' ] ),
		],
	},
	groupedEngagementReport: {
		rows: [
			...buildBreakdownReportRows(
				'woocommerce',
				[ '0.36', '3400' ],
				[ '0.39', '3800' ]
			),
			...buildBreakdownReportRows(
				'easy-digital-downloads',
				[ '0.5', '500' ],
				[ '0.25', '500' ]
			),
		],
	},
	aggregatedEventsReport: {
		totals: buildAggregatedTotalsRows( [ '112' ], [ '105' ] ),
	},
	aggregatedEngagementReport: {
		totals: buildAggregatedTotalsRows(
			[ '0.42', '5600' ],
			[ '0.4', '5250' ]
		),
	},
};

/**
 * The Analytics reports a Lead generation performance PDF loader test reads.
 *
 * The forms are the IDs `12` and `34`, and the grouped events report holds a
 * row with no form, so a test can check the "Other sources" group.
 */
export const LEAD_GENERATION_PDF_REPORT_FIXTURES: SiteGoalsPDFReportFixtures = {
	discoveryReport: {
		rows: [ '12', '34' ].map( ( value ) => ( {
			dimensionValues: [ { value } ],
			metricValues: [ { value: '52' } ],
		} ) ),
	},
	groupedEventsReport: {
		rows: [
			...buildBreakdownReportRows( '12', [ '40' ], [ '30' ] ),
			...buildBreakdownReportRows( '34', [ '12' ], [ '9' ] ),
			...buildBreakdownReportRows( '(not set)', [ '5' ], [ '2' ] ),
		],
	},
	groupedEngagementReport: {
		rows: [
			...buildBreakdownReportRows(
				'12',
				[ '0.4', '200' ],
				[ '0.3', '150' ]
			),
			...buildBreakdownReportRows(
				'34',
				[ '0.6', '100' ],
				[ '0.5', '90' ]
			),
		],
	},
	aggregatedEventsReport: {
		totals: buildAggregatedTotalsRows( [ '57' ], [ '41' ] ),
	},
	aggregatedEngagementReport: {
		totals: buildAggregatedTotalsRows(
			[ '0.45', '900' ],
			[ '0.42', '850' ]
		),
	},
};

/** The single Online store breakdown group a PDF section test renders. */
export const ONLINE_STORE_PDF_GROUPS: SiteGoalsPDFGroup[] = [
	{
		id: 'woocommerce',
		label: 'WooCommerce',
		total: { current: 85, previous: 76 },
		rate: { current: 0.025, previous: 0.02 },
		engagementRate: { current: 0.36, previous: 0.39 },
		sessions: { current: 3400, previous: 3800 },
	},
];

/** The single Lead generation breakdown group a PDF section test renders. */
export const LEAD_GENERATION_PDF_GROUPS: SiteGoalsPDFGroup[] = [
	{
		id: '12',
		label: '“Contact” form',
		total: { current: 40, previous: 30 },
		rate: { current: 0.2, previous: 0.2 },
		engagementRate: { current: 0.4, previous: 0.3 },
		sessions: { current: 200, previous: 150 },
	},
];
