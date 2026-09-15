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
import { createTotalsReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { render } from '@tests/js/test-utils';
import TotalVisitors from './TotalVisitors';

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

	it( 'should replace the total and its change badge with a placeholder while the report loads', () => {
		const { container, getByRole, queryByText } = render(
			<TotalVisitors
				report={ createTotalsReport( 1200, 1000 ) }
				loaded={ false }
			/>
		);

		expect(
			getByRole( 'heading', { name: 'Total visitors' } )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-preview-block' )
		).toBeInTheDocument();
		expect( queryByText( '1.2K' ) ).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toBeNull();
	} );

	it( 'should replace the total and its change badge with "Gathering data…" while the property is gathering data', () => {
		const { container, getByRole, getByText, queryByText } = render(
			<TotalVisitors
				report={ createTotalsReport( 1200, 1000 ) }
				gatheringData
			/>
		);

		expect(
			getByRole( 'heading', { name: 'Total visitors' } )
		).toBeInTheDocument();
		expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
		expect( queryByText( '1.2K' ) ).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toBeNull();
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
