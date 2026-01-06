/**
 * `usePieChartSlices()` custom hook tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import usePieChartSlices from './usePieChartSlices';

const PIE_CHART_COLORS = [
	'#fece72',
	'#a983e6',
	'#bed4ff',
	'#ee92da',
	'#ff9b7a',
];

describe( 'usePieChartSlices', () => {
	it( 'should return pie chart slices for the given dimension values', async () => {
		const { result } = await renderHook( () => usePieChartSlices() );

		expect( result.current ).toBeInstanceOf( Function );

		const getPieChartSlices = result.current;

		const pieChartSlices = getPieChartSlices( [
			'dimensionValue1',
			'dimensionValue2',
			'dimensionValue3',
		] );

		expect( pieChartSlices ).toEqual( {
			0: { color: PIE_CHART_COLORS[ 0 ] },
			1: { color: PIE_CHART_COLORS[ 1 ] },
			2: { color: PIE_CHART_COLORS[ 2 ] },
		} );
	} );

	it( 'should return the same colors for dimension values when they are passed in again in a different order', async () => {
		const { result } = await renderHook( () => usePieChartSlices() );

		const getPieChartSlices = result.current;

		let pieChartSlices = getPieChartSlices( [
			'dimensionValue1',
			'dimensionValue2',
			'dimensionValue3',
			'dimensionValue4',
			'dimensionValue5',
		] );

		expect( pieChartSlices ).toEqual( {
			0: { color: PIE_CHART_COLORS[ 0 ] },
			1: { color: PIE_CHART_COLORS[ 1 ] },
			2: { color: PIE_CHART_COLORS[ 2 ] },
			3: { color: PIE_CHART_COLORS[ 3 ] },
			4: { color: PIE_CHART_COLORS[ 4 ] },
		} );

		pieChartSlices = getPieChartSlices( [
			'dimensionValue3',
			'dimensionValue4',
			'dimensionValue5',
			'dimensionValue1',
			'dimensionValue2',
		] );

		expect( pieChartSlices ).toEqual( {
			0: { color: PIE_CHART_COLORS[ 2 ] },
			1: { color: PIE_CHART_COLORS[ 3 ] },
			2: { color: PIE_CHART_COLORS[ 4 ] },
			3: { color: PIE_CHART_COLORS[ 0 ] },
			4: { color: PIE_CHART_COLORS[ 1 ] },
		} );
	} );

	it( 'should reuse colors from the same palette for dimension values passed in which are not in the original array', async () => {
		const { result } = await renderHook( () => usePieChartSlices() );

		const getPieChartSlices = result.current;

		let pieChartSlices = getPieChartSlices( [
			'dimensionValue1',
			'dimensionValue2',
			'dimensionValue3',
			'dimensionValue4',
			'dimensionValue5',
		] );

		expect( pieChartSlices ).toEqual( {
			0: { color: PIE_CHART_COLORS[ 0 ] },
			1: { color: PIE_CHART_COLORS[ 1 ] },
			2: { color: PIE_CHART_COLORS[ 2 ] },
			3: { color: PIE_CHART_COLORS[ 3 ] },
			4: { color: PIE_CHART_COLORS[ 4 ] },
		} );

		pieChartSlices = getPieChartSlices( [
			'dimensionValue1',
			'dimensionValue10',
			'dimensionValue4',
			'dimensionValue3',
			'dimensionValue11',
		] );

		expect( pieChartSlices ).toEqual( {
			0: { color: PIE_CHART_COLORS[ 0 ] },
			1: { color: PIE_CHART_COLORS[ 1 ] },
			2: { color: PIE_CHART_COLORS[ 3 ] },
			3: { color: PIE_CHART_COLORS[ 2 ] },
			4: { color: PIE_CHART_COLORS[ 4 ] },
		} );
	} );

	it( 'should return `#ccc` for dimension values when there are more than five dimension values', async () => {
		const { result } = await renderHook( () => usePieChartSlices() );

		const getPieChartSlices = result.current;

		const pieChartSlices = getPieChartSlices( [
			'dimensionValue1',
			'dimensionValue2',
			'dimensionValue3',
			'dimensionValue4',
			'dimensionValue5',
			'dimensionValue6',
			'dimensionValue7',
		] );

		expect( pieChartSlices ).toEqual( {
			0: { color: PIE_CHART_COLORS[ 0 ] },
			1: { color: PIE_CHART_COLORS[ 1 ] },
			2: { color: PIE_CHART_COLORS[ 2 ] },
			3: { color: PIE_CHART_COLORS[ 3 ] },
			4: { color: PIE_CHART_COLORS[ 4 ] },
			5: { color: '#ccc' },
			6: { color: '#ccc' },
		} );
	} );

	it( 'should not clear the cached colors when the dimension values are empty', async () => {
		const { result } = await renderHook( () => usePieChartSlices() );

		const getPieChartSlices = result.current;

		let pieChartSlices = getPieChartSlices( [
			'dimensionValue1',
			'dimensionValue2',
		] );

		expect( pieChartSlices ).toEqual( {
			0: { color: PIE_CHART_COLORS[ 0 ] },
			1: { color: PIE_CHART_COLORS[ 1 ] },
		} );

		pieChartSlices = getPieChartSlices( [] );

		expect( pieChartSlices ).toEqual( {} );

		pieChartSlices = getPieChartSlices( [
			'dimensionValue3',
			'dimensionValue1',
		] );

		expect( pieChartSlices ).toEqual( {
			0: { color: PIE_CHART_COLORS[ 1 ] },
			1: { color: PIE_CHART_COLORS[ 0 ] },
		} );
	} );
} );
