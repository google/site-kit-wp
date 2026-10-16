/**
 * TypicalTrafficPanel tests.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createDailyTrafficRows } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	decodedBenchmarkingResponse,
	provideBenchmarkingData,
} from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, freezeFetch, render } from '@tests/js/test-utils';
import TypicalTrafficPanel from './TypicalTrafficPanel';

const mockTypicalTrafficChart = jest.fn();

// The chart has tests of its own, so the mock records the props the panel
// passes it.
jest.mock(
	'@/js/modules/analytics-4/components/traffic-overview/charts/TypicalTrafficChart',
	() => {
		return function TypicalTrafficChartMock(
			props: Record< string, unknown >
		) {
			mockTypicalTrafficChart( props );
			return null;
		};
	}
);

describe( 'TypicalTrafficPanel', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		// `last-28-days` against the `2026-09-15` reference date covers
		// `2026-08-19` to `2026-09-15`.
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-15' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( 1736510400000 );
	} );

	afterEach( () => {
		mockTypicalTrafficChart.mockClear();
	} );

	it( 'should pass the chart the rows of the response, the selected range, its length, and the creation time', async () => {
		const dailyTraffic = createDailyTrafficRows( '2026-09-15', () => 120 );

		provideBenchmarkingData(
			registry,
			{ startDate: '2026-08-19', endDate: '2026-09-15' },
			{ ...decodedBenchmarkingResponse, dailyTraffic }
		);

		const { waitForRegistry } = render( <TypicalTrafficPanel />, {
			registry,
		} );

		await waitForRegistry();

		expect( mockTypicalTrafficChart ).toHaveBeenLastCalledWith( {
			dailyTraffic: createDailyTrafficRows( '2026-09-15', () => 120 ),
			selectedStartDate: '2026-08-19',
			selectedEndDate: '2026-09-15',
			daysInSelectedRange: 28,
			propertyCreateTime: 1736510400000,
		} );
	} );

	it( 'should not render the chart before the response arrives', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
			)
		);

		render( <TypicalTrafficPanel />, { registry } );

		expect( mockTypicalTrafficChart ).not.toHaveBeenCalled();
	} );
} );
