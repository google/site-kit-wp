/**
 * Site Goals Key action chart report options tests.
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
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import getKeyActionChartReportOptions from './getKeyActionChartReportOptions';

const dates = { startDate: '2020-08-11', endDate: '2020-09-07' };

describe( 'getKeyActionChartReportOptions', () => {
	it( 'asks for a daily event count over the selected date range', () => {
		expect(
			getKeyActionChartReportOptions( {
				dates,
				eventNames: [ 'purchase' ],
				goalType: GOAL_TYPES.ECOMMERCE,
			} )
		).toEqual( {
			startDate: '2020-08-11',
			endDate: '2020-09-07',
			metrics: [ { name: 'eventCount' } ],
			dimensions: [ { name: 'date' } ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ 'purchase' ],
				},
			},
			orderby: [ { dimension: { dimensionName: 'date' } } ],
			reportID: `analytics-4_site-goals_key-action-over-time_${ GOAL_TYPES.ECOMMERCE }`,
		} );
	} );

	it( 'counts every event name of the Key action together', () => {
		const { dimensionFilters } = getKeyActionChartReportOptions( {
			dates,
			eventNames: [ 'submit_lead_form', 'contact' ],
			goalType: GOAL_TYPES.LEAD,
		} );

		expect( dimensionFilters?.eventName ).toEqual( {
			filterType: 'inListFilter',
			value: [ 'submit_lead_form', 'contact' ],
		} );
	} );

	it( "adds the selected breakdown tab's filter beside the event filter", () => {
		const { dimensionFilters } = getKeyActionChartReportOptions( {
			dates,
			eventNames: [ 'purchase' ],
			goalType: GOAL_TYPES.ECOMMERCE,
			breakdownFilter: {
				'customEvent:googlesitekit_event_provider': 'woocommerce',
			},
		} );

		expect( dimensionFilters ).toEqual( {
			eventName: {
				filterType: 'inListFilter',
				value: [ 'purchase' ],
			},
			'customEvent:googlesitekit_event_provider': 'woocommerce',
		} );
	} );

	it( 'labels the report with the goal it was built for', () => {
		expect(
			getKeyActionChartReportOptions( {
				dates,
				eventNames: [ 'submit_lead_form' ],
				goalType: GOAL_TYPES.LEAD,
			} ).reportID
		).toBe(
			`analytics-4_site-goals_key-action-over-time_${ GOAL_TYPES.LEAD }`
		);
	} );
} );
