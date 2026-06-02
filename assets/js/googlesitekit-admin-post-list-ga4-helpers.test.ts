/**
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
import {
	chunkArray,
	parseRowsToPathMap,
} from './googlesitekit-admin-post-list-ga4-helpers';

describe( 'chunkArray', () => {
	it( 'returns empty array for empty input', () => {
		expect( chunkArray( [], 3 ) ).toStrictEqual( [] );
	} );

	it( 'chunks into fixed sizes', () => {
		expect( chunkArray( [ 1, 2, 3, 4, 5 ], 2 ) ).toStrictEqual( [
			[ 1, 2 ],
			[ 3, 4 ],
			[ 5 ],
		] );
	} );
} );

describe( 'parseRowsToPathMap', () => {
	it( 'returns empty object when rows missing', () => {
		expect( parseRowsToPathMap( {} ) ).toStrictEqual( {} );
		expect( parseRowsToPathMap( { rows: [] } ) ).toStrictEqual( {} );
	} );

	it( 'maps dimension to first metric value', () => {
		const report = {
			rows: [
				{
					dimensionValues: [ { value: '/foo' } ],
					metricValues: [ { value: '10' } ],
				},
				{
					dimensionValues: [ { value: '/bar?x=1' } ],
					metricValues: [ { value: '3' } ],
				},
			],
		};
		expect( parseRowsToPathMap( report ) ).toStrictEqual( {
			'/foo': '10',
			'/bar?x=1': '3',
		} );
	} );
} );
