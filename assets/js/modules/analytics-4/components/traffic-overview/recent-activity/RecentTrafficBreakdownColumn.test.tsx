/**
 * Recent activity breakdown column tests.
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
import { createTestRegistry, render } from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import RecentTrafficBreakdownColumn from './RecentTrafficBreakdownColumn';

describe( 'RecentTrafficBreakdownColumn', () => {
	it( 'should render the title, and the label, the visitors and the share of each row, inside the column with the rail and the dot', () => {
		const { container, getByText } = render(
			<RecentTrafficBreakdownColumn
				title="Top channels by visitors"
				rows={ [
					{
						label: 'Direct',
						value: '82',
						secondaryValue: '(34.1%)',
					},
				] }
				loading={ false }
				onRetry={ jest.fn() }
			/>
		);

		expect( container.firstChild ).toHaveClass(
			'googlesitekit-traffic-overview__breakdown-column'
		);
		expect( getByText( 'Top channels by visitors' ) ).toBeInTheDocument();
		expect( getByText( 'Direct' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-table-tile__cell--value' )
		).toHaveTextContent( '82(34.1%)' );
	} );

	it( 'should render the message that the site has no visitors when the column has no rows, even when the page has an entity URL', () => {
		const registry = createTestRegistry();
		provideSiteInfo( registry, {
			currentEntityURL: 'https://example.com/about/',
		} );

		const { getByText } = render(
			<RecentTrafficBreakdownColumn
				title="Top channels by visitors"
				rows={ [] }
				loading={ false }
				onRetry={ jest.fn() }
			/>,
			{ registry }
		);

		expect(
			getByText(
				'No data to display: your site hasn’t received any visitors yet'
			)
		).toBeInTheDocument();
	} );
} );
