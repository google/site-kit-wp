/**
 * Traffic Overview total visitors tests.
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
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { render } from '@tests/js/test-utils';
import TotalVisitors from './TotalVisitors';

/**
 * Builds a totals report holding the selected range then the range before it.
 *
 * The values are strings, the way the API returns them.
 *
 * @since 1.188.0
 *
 * @param {number} currentValue  Visitors over the selected range.
 * @param {number} previousValue Visitors over the range before it.
 * @return {Object} The totals report.
 */
function createTotalsReport(
	currentValue: number,
	previousValue: number
): Report {
	return {
		totals: [
			{ metricValues: [ { value: String( currentValue ) } ] },
			{ metricValues: [ { value: String( previousValue ) } ] },
		],
	};
}

describe( 'TotalVisitors', () => {
	it.each( [
		[ 843, '843' ],
		[ 1234, '1.2K' ],
		[ 12345, '12K' ],
		[ 1234567, '1.2M' ],
	] )( 'should abbreviate %s visits as %s', ( visits, expected ) => {
		const { getByText } = render(
			<TotalVisitors totalVisits={ { current: visits, previous: 1 } } />
		);

		expect( getByText( expected ) ).toHaveClass(
			'googlesitekit-traffic-overview__total-visits-figure'
		);
	} );

	it.each( [
		[ 1200, 1000, '+20%' ],
		[ 1000, 1200, '-16.7%' ],
		[ 1000, 1000, '0%' ],
	] )(
		'should render %s visits against a previous %s as %s',
		( current, previous, expected ) => {
			const { getByText } = render(
				<TotalVisitors totalVisits={ { current, previous } } />
			);

			expect( getByText( expected ) ).toBeInTheDocument();
		}
	);

	it( 'should render the figure and no badge when the previous total is zero', () => {
		const { container, getByText, queryByText } = render(
			<TotalVisitors totalVisits={ { current: 1000, previous: 0 } } />
		);

		expect( getByText( '1K' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toBeNull();
		// The label only means anything next to a badge.
		expect( queryByText( 'Vs. prev. 28 days' ) ).not.toBeInTheDocument();
	} );

	it( 'should name the comparison period beside the badge', () => {
		const { getByText } = render(
			<TotalVisitors totalVisits={ { current: 1200, previous: 1000 } } />
		);

		expect( getByText( 'Vs. prev. 28 days' ) ).toBeInTheDocument();
	} );

	it( 'should render zero and a zero badge when both totals are zero', () => {
		const { container } = render(
			<TotalVisitors totalVisits={ { current: 0, previous: 0 } } />
		);

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__total-visits-figure'
			)
		).toHaveTextContent( /^0$/ );
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '0%' );
	} );

	it( 'should replace both figures and the change badge with a placeholder while the figures load', () => {
		const { container, queryByText } = render(
			<TotalVisitors
				report={ createTotalsReport( 234, 200 ) }
				totalVisits={ { current: 1200, previous: 1000 } }
				loaded={ false }
			/>
		);

		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).toBeInTheDocument();
		expect( queryByText( '1.2K' ) ).not.toBeInTheDocument();
		expect( queryByText( '234' ) ).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toBeNull();
	} );

	it( 'should replace both figures and the change badge with "Gathering data…" while the property is gathering data', () => {
		const { container, getByText, queryByText } = render(
			<TotalVisitors
				report={ createTotalsReport( 234, 200 ) }
				totalVisits={ { current: 1200, previous: 1000 } }
				gatheringData
			/>
		);

		expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
		expect( queryByText( '1.2K' ) ).not.toBeInTheDocument();
		expect( queryByText( '234' ) ).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toBeNull();
	} );

	it( 'should render "Total visits" under the total visits figure', () => {
		const { getByText } = render(
			<TotalVisitors totalVisits={ { current: 1200, previous: 1000 } } />
		);

		expect( getByText( 'Total visits' ).previousElementSibling ).toBe(
			getByText( '1.2K' )
		);
	} );

	it( 'should render the unique visitors of the selected range, abbreviated, with an info icon that explains them', () => {
		const { getByRole, getByText, queryByText } = render(
			<TotalVisitors
				report={ createTotalsReport( 1234, 999 ) }
				totalVisits={ { current: 5000, previous: 4000 } }
			/>
		);

		expect( getByText( '1.2K' ) ).toHaveClass(
			'googlesitekit-traffic-overview__unique-visitors-figure'
		);
		expect( queryByText( '999' ) ).not.toBeInTheDocument();
		expect( getByText( 'Unique visitors' ) ).toBeInTheDocument();
		expect(
			getByRole( 'button', {
				name: 'Shows how many people visited your site, counting each person once.',
			} )
		).toBeInTheDocument();
	} );

	it( 'should compare the total visits with the range before, and not the unique visitors', () => {
		const { container } = render(
			<TotalVisitors
				report={ createTotalsReport( 1200, 1000 ) }
				totalVisits={ { current: 5000, previous: 4000 } }
			/>
		);

		const badges = container.querySelectorAll(
			'.googlesitekit-change-badge'
		);

		expect( badges ).toHaveLength( 1 );
		expect( badges[ 0 ] ).toHaveTextContent( '+25%' );
	} );
} );
