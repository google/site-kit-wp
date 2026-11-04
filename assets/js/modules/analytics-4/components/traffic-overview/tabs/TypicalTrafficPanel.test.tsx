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
import GoogleChart from '@/js/components/GoogleChart';
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createDailyTrafficRows } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	decodedBenchmarkingResponse,
	provideBenchmarkingData,
} from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	act,
	createTestRegistry,
	freezeFetch,
	render,
} from '@tests/js/test-utils';
import TypicalTrafficPanel from './TypicalTrafficPanel';

jest.mock( '@/js/components/GoogleChart', () =>
	jest
		.requireActual( '@tests/js/mock-google-chart-utils' )
		.mockGoogleChartModule()
);

const mockGoogleChart = jest.mocked( GoogleChart );

describe( 'TypicalTrafficPanel', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		// The default `last-28-days` range against the `2026-09-15` reference
		// date covers `2026-08-19` to `2026-09-15`.
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-09-15' );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		mockGoogleChart.mockClear();
	} );

	it( 'should plot the 28 days of "Last 28 days", then the 90 days of "Last 90 days" when the date range changes', () => {
		provideBenchmarkingData(
			registry,
			{ startDate: '2026-08-19', endDate: '2026-09-15' },
			{
				...decodedBenchmarkingResponse,
				dailyTraffic: createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				),
			}
		);
		// `last-90-days` against the same reference date covers `2026-06-18` to
		// `2026-09-15`.
		provideBenchmarkingData(
			registry,
			{ startDate: '2026-06-18', endDate: '2026-09-15' },
			{
				...decodedBenchmarkingResponse,
				dailyTraffic: createDailyTrafficRows(
					90,
					'2026-09-15',
					() => 80
				),
			}
		);

		const { getByRole } = render( <TypicalTrafficPanel />, { registry } );

		expect(
			mockGoogleChart.mock.lastCall?.[ 0 ].data.slice( 1 )
		).toHaveLength( 28 );
		expect( getByRole( 'listitem' ) ).toHaveTextContent(
			'Last 28 days traffic'
		);

		act( () => {
			registry.dispatch( CORE_USER ).setDateRange( 'last-90-days' );
		} );

		expect(
			mockGoogleChart.mock.lastCall?.[ 0 ].data.slice( 1 )
		).toHaveLength( 90 );
		expect( getByRole( 'listitem' ) ).toHaveTextContent(
			'Last 90 days traffic'
		);
	} );

	it( 'should mark the day the Analytics property was created when that day is inside the selected range', () => {
		// The time is midday, because a time zone can move midnight to the day
		// before or the day after.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( '2026-09-01T12:00:00' );
		provideBenchmarkingData(
			registry,
			{ startDate: '2026-08-19', endDate: '2026-09-15' },
			{
				...decodedBenchmarkingResponse,
				dailyTraffic: createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				),
			}
		);

		render( <TypicalTrafficPanel />, { registry } );

		expect( mockGoogleChart.mock.lastCall?.[ 0 ].dateMarkers ).toEqual( [
			{
				date: '2026-09-01',
				text: 'Google Analytics property created',
			},
		] );
	} );

	it( 'should mark the day the Analytics property was created on a view-only dashboard', () => {
		// The time is midday, because a time zone can move midnight to the day
		// before or the day after.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setPropertyCreateTime( '2026-09-01T12:00:00' );
		provideBenchmarkingData(
			registry,
			{ startDate: '2026-08-19', endDate: '2026-09-15' },
			{
				...decodedBenchmarkingResponse,
				dailyTraffic: createDailyTrafficRows(
					28,
					'2026-09-15',
					() => 120
				),
			}
		);

		render( <TypicalTrafficPanel />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( mockGoogleChart.mock.lastCall?.[ 0 ].dateMarkers ).toEqual( [
			{
				date: '2026-09-01',
				text: 'Google Analytics property created',
			},
		] );
	} );

	it( 'should render no chart while the benchmarking data loads', () => {
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
			)
		);

		render( <TypicalTrafficPanel />, { registry } );

		expect( mockGoogleChart ).not.toHaveBeenCalled();
	} );
} );
