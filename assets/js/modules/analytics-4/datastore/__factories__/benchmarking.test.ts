/**
 * Analytics datastore test factory: benchmarking tests.
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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry } from '@tests/js/utils';
import { decodedBenchmarkingResponse, provideBenchmarkingData } from '.';

describe( 'decodedBenchmarkingResponse', () => {
	it( 'should have the decoded visitor totals and dimensions of the `benchmarking-data.json` fixture', () => {
		expect( decodedBenchmarkingResponse ).toMatchObject( {
			visitors: { current: 412, previous: 388 },
			dimensions: [
				'CONTENT',
				'SEARCH_QUERIES',
				'REFERRERS',
				'CHANNELS',
			],
		} );
	} );
} );

describe( 'provideBenchmarkingData', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should make `getBenchmarkingData()` return `decodedBenchmarkingResponse` for the start date and the end date when no `response` argument is passed', () => {
		provideBenchmarkingData( registry, {
			startDate: '2026-08-19',
			endDate: '2026-09-15',
		} );

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' )
		).toBe( decodedBenchmarkingResponse );
	} );

	it( 'should make `getBenchmarkingData()` return the `response` argument', () => {
		provideBenchmarkingData(
			registry,
			{ startDate: '2026-08-19', endDate: '2026-09-15' },
			{
				visitors: { current: 0, previous: 0 },
				dailyTraffic: [ { date: '2025-08-18', visitors: 0 } ],
				dimensions: [],
				contextualData: {},
			}
		);

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.getBenchmarkingData( '2026-08-19', '2026-09-15' )
		).toEqual( {
			visitors: { current: 0, previous: 0 },
			dailyTraffic: [ { date: '2025-08-18', visitors: 0 } ],
			dimensions: [],
			contextualData: {},
		} );
	} );

	it( 'should finish the resolution of `getBenchmarkingData()` for the start date and the end date', () => {
		provideBenchmarkingData( registry, {
			startDate: '2026-08-19',
			endDate: '2026-09-15',
		} );

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.hasFinishedResolution( 'getBenchmarkingData', [
					'2026-08-19',
					'2026-09-15',
				] )
		).toBe( true );
	} );
} );
