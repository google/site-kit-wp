/**
 * UseVisitorTypeGoalDriverData hook tests.
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
import { renderHook } from '../../../../../../../../tests/js/test-utils';
import { createTestRegistry } from '../../../../../../../../tests/js/utils';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useVisitorTypeGoalDriverData from './useVisitorTypeGoalDriverData';

describe( 'useVisitorTypeGoalDriverData', () => {
	it( 'maps visitor labels for lead event arrays', async () => {
		const registry = createTestRegistry();

		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-04-10' );

		const dates = registry.select( CORE_USER ).getDateRangeDates( {
			offsetDays: DATE_RANGE_OFFSET,
		} );
		const reportOptions = {
			...dates,
			dimensions: [ 'newVsReturning' ],
			dimensionFilters: {
				eventName: {
					filterType: 'inListFilter',
					value: [ 'contact', 'generate_lead' ],
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [ { metric: { metricName: 'eventCount' }, desc: true } ],
			limit: 6,
			keepEmptyRows: false,
			reportID: 'analytics-4_site-goals_visitor-type_lead',
		};

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [ { value: 'returning' } ],
						metricValues: [ { value: '60' } ],
					},
					{
						dimensionValues: [ { value: 'new' } ],
						metricValues: [ { value: '40' } ],
					},
				],
			},
			{
				options: reportOptions,
			}
		);

		const { result, waitForRegistry } = renderHook(
			() =>
				useVisitorTypeGoalDriverData( {
					goalType: 'lead',
					primaryEvent: [ 'contact', 'generate_lead' ],
				} ),
			{ registry }
		);

		await waitForRegistry();

		expect( result.current.totalRows ).toBe( 2 );
		expect( result.current.rows[ 0 ].label ).toBe( 'Returning visitors' );
		expect( result.current.rows[ 1 ].label ).toBe( 'New visitors' );
		expect( result.current.rows[ 0 ].value ).toMatch( /60/ );
	} );
} );
