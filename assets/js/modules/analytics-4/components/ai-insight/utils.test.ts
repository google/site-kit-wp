/**
 * AI insight utility function tests.
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
import { splitBoldSegments } from './utils';

describe( 'splitBoldSegments', () => {
	it( 'should return one bold segment between plain segments', () => {
		expect(
			splitBoldSegments( 'Sales are up by **12%** this week.' )
		).toEqual( [
			{ text: 'Sales are up by ', isBold: false },
			{ text: '12%', isBold: true },
			{ text: ' this week.', isBold: false },
		] );
	} );

	it( 'should return several bold segments in their original order', () => {
		expect(
			splitBoldSegments( '**Direct** and **Organic search** grew.' )
		).toEqual( [
			{ text: 'Direct', isBold: true },
			{ text: ' and ', isBold: false },
			{ text: 'Organic search', isBold: true },
			{ text: ' grew.', isBold: false },
		] );
	} );

	it( 'should return the whole text as one plain segment when it has no `**` pair', () => {
		expect( splitBoldSegments( 'Sales are up this week.' ) ).toEqual( [
			{ text: 'Sales are up this week.', isBold: false },
		] );
	} );

	it( 'should return a bold segment that spans a line break', () => {
		expect( splitBoldSegments( '**Direct\nsessions** grew.' ) ).toEqual( [
			{ text: 'Direct\nsessions', isBold: true },
			{ text: ' grew.', isBold: false },
		] );
	} );

	it( 'should keep an unclosed `**` as characters in a plain segment', () => {
		expect( splitBoldSegments( '**Direct** grew by **12%' ) ).toEqual( [
			{ text: 'Direct', isBold: true },
			{ text: ' grew by **12%', isBold: false },
		] );
	} );

	it( 'should return an empty array for an empty string', () => {
		expect( splitBoldSegments( '' ) ).toEqual( [] );
	} );
} );
