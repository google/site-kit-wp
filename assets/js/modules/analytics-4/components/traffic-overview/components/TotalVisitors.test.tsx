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
 * @since n.e.x.t
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
	] )( 'should abbreviate %s visitors as %s', ( totalUsers, expected ) => {
		const { getByText } = render(
			<TotalVisitors report={ createTotalsReport( totalUsers, 1 ) } />
		);

		expect( getByText( expected ) ).toBeInTheDocument();
	} );

	it.each( [
		[ 1200, 1000, '+20%' ],
		[ 1000, 1200, '-16.7%' ],
		[ 1000, 1000, '0%' ],
	] )(
		'should render %s against a previous %s as %s',
		( currentValue, previousValue, expected ) => {
			const { getByText } = render(
				<TotalVisitors
					report={ createTotalsReport( currentValue, previousValue ) }
				/>
			);

			expect( getByText( expected ) ).toBeInTheDocument();
		}
	);

	it( 'should render the figure and no badge when the previous total is zero', () => {
		const { container, getByText, queryByText } = render(
			<TotalVisitors report={ createTotalsReport( 1000, 0 ) } />
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
			<TotalVisitors report={ createTotalsReport( 1200, 1000 ) } />
		);

		expect( getByText( 'Vs. prev. 28 days' ) ).toBeInTheDocument();
	} );

	it( 'should render zero and a zero badge when both totals are zero', () => {
		const { container, getByText } = render(
			<TotalVisitors report={ createTotalsReport( 0, 0 ) } />
		);

		expect( getByText( '0' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '0%' );
	} );

	it( 'should read a missing report as zero visitors', () => {
		// This is what the section shows while the report is still on its way,
		// which reads as a real zero. #13411 replaces it with a loading state.
		const { container, getByText } = render( <TotalVisitors /> );

		expect( getByText( '0' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '0%' );
	} );

	it( 'should render the title as plain text, and nothing in the section is clickable', () => {
		const { container, getByRole } = render(
			<TotalVisitors report={ createTotalsReport( 1000, 800 ) } />
		);

		const title = getByRole( 'heading', { name: 'Total visitors' } );

		expect( title ).toBeInTheDocument();
		// The card this replaces put an "All Visitors ›" breadcrumb here, so
		// the title must hold the string and nothing else.
		expect( title ).toHaveTextContent( 'Total visitors' );
		expect( title.querySelector( 'svg' ) ).toBeNull();

		expect( container.querySelector( 'a' ) ).toBeNull();
		expect( container.querySelector( 'button' ) ).toBeNull();
	} );
} );
