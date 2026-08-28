/**
 * Key action tiles tests.
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
import { render } from '@tests/js/test-utils';
import { KeyActionChartTileProps } from './KeyActionChartTile';
import KeyActionTiles from './KeyActionTiles';

const mockKeyActionChartTile = jest.fn();

// The chart tile is stubbed, because its own test file covers the report. The
// stub copies the real tile's title markup, so a test can read all three
// titles in order.
jest.mock( './KeyActionChartTile', () => {
	return function KeyActionChartTileStub( props: KeyActionChartTileProps ) {
		mockKeyActionChartTile( props );
		return (
			<div className="googlesitekit-site-goals-tile__title">
				{ props.title }
			</div>
		);
	};
} );

describe( 'KeyActionTiles', () => {
	const props = {
		supportURL: 'https://example.com/help',
		rateTitle: 'Sales Rate',
		totalTitle: 'Total Sales',
		totalSubtitle: '“purchase” events',
		chartTitle: 'Total sales in the last 28 days',
		currentRate: 0.5,
		previousRate: 0.4,
		currentSessions: 100,
		currentCount: 42,
		previousCount: 30,
		otherSourcesCount: 7,
		otherSourcesPreviousCount: 3,
		dates: { startDate: '2020-08-11', endDate: '2020-09-07' },
		eventNames: [ 'purchase' ],
		goalType: GOAL_TYPES.ECOMMERCE,
		breakdownFilter: {
			'customEvent:googlesitekit_event_provider': 'woocommerce',
		},
	};

	afterEach( () => {
		mockKeyActionChartTile.mockClear();
	} );

	it( "shows the rate, total, and chart tiles, with the tab's own count, on a value tab", () => {
		const { container, getByText, queryByText } = render(
			<KeyActionTiles { ...props } isOtherSourcesTab={ false } />
		);

		const titles = Array.from(
			container.querySelectorAll(
				'.googlesitekit-site-goals-tile__title'
			)
		).map( ( title ) => title.textContent );

		expect( titles ).toEqual( [
			'Sales Rate',
			'Total Sales',
			'Total sales in the last 28 days',
		] );

		// The value-tab count is shown, not the Other sources count.
		expect( getByText( '42' ) ).toBeInTheDocument();
		expect( queryByText( '7' ) ).not.toBeInTheDocument();
	} );

	it( 'gives the chart tile the date range, events, goal, and tab filter', () => {
		render( <KeyActionTiles { ...props } isOtherSourcesTab={ false } /> );

		expect( mockKeyActionChartTile ).toHaveBeenCalledWith(
			expect.objectContaining( {
				dates: { startDate: '2020-08-11', endDate: '2020-09-07' },
				eventNames: [ 'purchase' ],
				goalType: 'ecommerce',
				breakdownFilter: {
					'customEvent:googlesitekit_event_provider': 'woocommerce',
				},
			} )
		);
	} );

	it( 'shows only the total tile, with the unattributed count, on the Other sources tab', () => {
		const { getByText, queryByText } = render(
			<KeyActionTiles { ...props } isOtherSourcesTab />
		);

		// No rate tile (no per-source sessions to rate against).
		expect( queryByText( 'Sales Rate' ) ).not.toBeInTheDocument();
		// The chart tile doesn't appear either, because unattributed events
		// have no per-source filter to count them by day.
		expect(
			queryByText( 'Total sales in the last 28 days' )
		).not.toBeInTheDocument();
		expect( getByText( 'Total Sales' ) ).toBeInTheDocument();
		// The unattributed count is shown instead of the value-tab count.
		expect( getByText( '7' ) ).toBeInTheDocument();
		expect( queryByText( '42' ) ).not.toBeInTheDocument();
	} );
} );
