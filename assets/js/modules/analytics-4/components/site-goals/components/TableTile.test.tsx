/**
 * TableTile component tests.
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
import { render } from '../../../../../../../tests/js/test-utils';
import TableTile from './TableTile';

describe( 'TableTile', () => {
	it( 'renders title, header label, and rows', () => {
		const { getByText } = render(
			<TableTile
				title="Top pages driving leads"
				headerLabel="Events"
				rows={ [
					{ label: 'Page A', value: 40 },
					{ label: 'Page B', value: 25 },
				] }
			/>
		);

		expect( getByText( 'Top pages driving leads' ) ).toBeInTheDocument();
		expect( getByText( 'Events' ) ).toBeInTheDocument();
		expect( getByText( 'Page A' ) ).toBeInTheDocument();
		expect( getByText( '40' ) ).toBeInTheDocument();
		expect( getByText( 'Page B' ) ).toBeInTheDocument();
		expect( getByText( '25' ) ).toBeInTheDocument();
	} );

	it( 'renders linked labels when row URL is provided', () => {
		const { getByRole } = render(
			<TableTile
				title="Top pages driving leads"
				rows={ [
					{
						label: 'Landing page',
						value: 10,
						url: 'https://example.com/page',
					},
				] }
			/>
		);

		expect(
			getByRole( 'link', { name: /Landing page/i } )
		).toHaveAttribute( 'href', 'https://example.com/page' );
	} );

	it( 'renders goal-specific zero data message', () => {
		const { getByText } = render(
			<TableTile
				title="Top traffic channels driving sales"
				rows={ [] }
				noDataMetricLabel="sales"
			/>
		);

		expect(
			getByText(
				/No data to display: your site hasn’t received any sales yet/i
			)
		).toBeInTheDocument();
	} );

	it( 'renders error state with actions', () => {
		const { getByText } = render(
			<TableTile
				title="Top pages driving leads"
				error={ {
					code: 400,
					message: 'Data loading failed',
					data: { status: 400, reason: 'badRequest' },
				} }
			/>
		);

		expect( getByText( 'Data loading failed' ) ).toBeInTheDocument();
		expect( getByText( 'Get help' ) ).toBeInTheDocument();
	} );
} );
