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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import { provideModuleRegistrations, provideModules } from '@tests/js/utils';
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

	it( 'should render the title as an `h3` by default', () => {
		const { getByRole } = render(
			<TableTile
				title="Top channels by visitors"
				rows={ [ { label: 'Direct', value: 40 } ] }
			/>
		);

		expect(
			getByRole( 'heading', {
				level: 3,
				name: 'Top channels by visitors',
			} )
		).toBeInTheDocument();
	} );

	it( 'should render the title as the heading element that `titleAs` names', () => {
		const { getByRole } = render(
			<TableTile
				title="Top channels by visitors"
				titleAs="h4"
				rows={ [ { label: 'Direct', value: 40 } ] }
			/>
		);

		expect(
			getByRole( 'heading', {
				level: 4,
				name: 'Top channels by visitors',
			} )
		).toBeInTheDocument();
	} );

	it( "should render a row's secondary value after its value", () => {
		const { container } = render(
			<TableTile
				title="Top pages driving leads"
				rows={ [
					{ label: 'Page A', value: 40, secondaryValue: '34%' },
				] }
			/>
		);

		const valueCell = container.querySelector(
			'.googlesitekit-table-tile__cell--value'
		);

		expect( valueCell ).toHaveTextContent( '4034%' );
		expect(
			valueCell?.querySelector(
				'.googlesitekit-table-tile__secondary-value'
			)
		).toHaveTextContent( '34%' );
	} );

	it( 'should render a secondary value of 0', () => {
		const { container } = render(
			<TableTile
				title="Top pages driving leads"
				rows={ [ { label: 'Page A', value: 40, secondaryValue: 0 } ] }
			/>
		);

		expect(
			container.querySelector(
				'.googlesitekit-table-tile__secondary-value'
			)
		).toHaveTextContent( '0' );
	} );

	it( 'should render only the value for a row without a secondary value', () => {
		const { container } = render(
			<TableTile
				title="Top pages driving leads"
				rows={ [ { label: 'Page A', value: 40 } ] }
			/>
		);

		const valueCell = container.querySelector(
			'.googlesitekit-table-tile__cell--value'
		);

		expect( valueCell?.innerHTML ).toBe( '40' );
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

	it( 'renders error state with actions', async () => {
		// The error actions read the module list, so it is in the store
		// before the tile renders, and no request for it outlives the test.
		const registry = createTestRegistry();
		provideModules( registry );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		const { getByText, waitForRegistry } = render(
			<TableTile
				title="Top pages driving leads"
				error={ {
					code: 400,
					message: 'Data loading failed',
					data: { status: 400, reason: 'badRequest' },
				} }
			/>,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( 'Data loading failed' ) ).toBeInTheDocument();
		expect( getByText( 'Get help' ) ).toBeInTheDocument();
	} );

	it( 'should call `onRetry` when the "Retry" button of the error state is clicked', async () => {
		const registry = createTestRegistry();
		provideModules( registry );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		// The "Retry" button appears only for an error that the store saved
		// for a `getReport` call.
		const error = {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500 },
		};
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( error, 'getReport', [
				{
					startDate: '2025-02-03',
					endDate: '2025-02-05',
					metrics: [ { name: 'totalUsers' } ],
				},
			] );

		const onRetry = jest.fn();

		const { getByRole, waitForRegistry } = render(
			<TableTile
				title="Top channels by visitors"
				error={ error }
				onRetry={ onRetry }
			/>,
			{ registry }
		);

		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /retry/i } ) );

		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );
} );
