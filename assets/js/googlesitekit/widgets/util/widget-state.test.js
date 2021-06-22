/**
 * Tests for widget state utils.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { SPECIAL_WIDGET_STATES } from './constants';
import {
	sortWidgetsByState,
	getWidgetsWithSpecialState,
	sortWidgetsBySpecialState,
} from './widget-states';

describe( 'Widget state utils', () => {
	describe( 'getWidgetsWithSpecialState', () => {
		it( 'should return a list of widgets that are in a special state', () => {
			expect( getWidgetsWithSpecialState( [
				[ 'A', SPECIAL_WIDGET_STATES[ 0 ] ],
				[ 'B', SPECIAL_WIDGET_STATES[ 1 ] ],
				[ 'C', undefined ],
			] ) ).toEqual( [
				[ 'A', SPECIAL_WIDGET_STATES[ 0 ] ],
				[ 'B', SPECIAL_WIDGET_STATES[ 1 ] ],
			] );
		} );

		it( 'should return an empty array if none of the provided widgets are in a special state', () => {
			expect( getWidgetsWithSpecialState() ).toEqual( [] );
		} );
	} );

	describe( 'sortWidgetsByState', () => {
		it( 'should return a list of widgets grouped by state', () => {
			const res = sortWidgetsByState( [
				[ 'A', SPECIAL_WIDGET_STATES[ 0 ] ],
				[ 'B', undefined ],
				[ 'C', SPECIAL_WIDGET_STATES[ 0 ] ],
			] );
			expect( res ).toEqual( [
				[ [ 'A', 'C' ], SPECIAL_WIDGET_STATES[ 0 ] ],
				[ [ 'B' ], undefined ],
			] );
		} );

		it( 'should return an empty array if no widget array is provided', () => {
			expect( sortWidgetsByState() ).toEqual( [] );
		} );
	} );

	describe( 'sortWidgetsBySpecialState', () => {
		it( 'should return the widgets from a given list that are in the same special state', () => {
			expect( sortWidgetsBySpecialState( [
				[ 'A', SPECIAL_WIDGET_STATES[ 0 ] ],
				[ 'B', SPECIAL_WIDGET_STATES[ 1 ] ],
				[ 'C', SPECIAL_WIDGET_STATES[ 0 ] ],
				[ 'D', undefined ],
			] ) ).toEqual( [
				[ [ 'A', 'C' ], SPECIAL_WIDGET_STATES[ 0 ] ],
				[ [ 'B' ], SPECIAL_WIDGET_STATES[ 1 ] ],
			] );
		} );
	} );
} );
