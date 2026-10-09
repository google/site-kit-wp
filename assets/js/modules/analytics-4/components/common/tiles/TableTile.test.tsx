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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	act,
	createTestRegistry,
	fireEvent,
	render,
} from '@tests/js/test-utils';
import {
	provideModuleRegistrations,
	provideModules,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import TableTile from './TableTile';

describe( 'TableTile', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		// The error tests render `ReportError`, which reads the module list
		// and the Analytics settings, so the registry has both and sends no
		// request for them.
		registry = createTestRegistry();
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	it( 'should render the title, the header label, and the rows', () => {
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

	it( 'should render a row label as a link when the row has a URL', () => {
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

	it( 'should render the "sales" zero data message when `noDataMetricLabel` is "sales"', () => {
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

	it( 'should render the error message and the "Get help" link of an error', async () => {
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

	it( 'should call `onRetry` when the user clicks the "Retry" button of the error', async () => {
		const error = {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500 },
		};

		// The "Retry" button appears for an error the store saved for a
		// report request.
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( error, 'getReport', [
				{
					startDate: '2025-02-04',
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

		// The click updates the data store, and `ReportErrorActions` renders
		// again after the click returns.
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );
			await waitForDefaultTimeouts();
		} );

		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );
} );
