/**
 * ModulePopularPagesWidgetGA4 component tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
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
	provideSiteInfo,
	provideUserInfo,
} from '@tests/js/utils';
import ModulePopularPagesWidgetGA4 from '.';

describe( 'ModulePopularPagesWidgetGA4', () => {
	let registry: WPDataRegistry;

	const widgetComponentProps = getWidgetComponentProps(
		'analyticsModulePopularPagesGA4'
	);

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-08' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideUserInfo( registry );
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetRecentContent( [], {
			count: 10,
			includeProducts: false,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getRecentContent', [ { count: 10 } ] );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
	} );

	it( 'should render the Top content card without tabs when freshData is disabled', async () => {
		const { container, queryAllByRole, getByText, waitForRegistry } =
			render(
				<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

		await waitForRegistry();

		expect( queryAllByRole( 'tab' ) ).toHaveLength( 0 );
		expect(
			getByText( 'Top content over the last 28 days' )
		).toBeInTheDocument();
		expect( container ).toMatchSnapshot();
	} );

	it( 'should render the tabs in place of the header title when freshData is enabled', async () => {
		const { container, getAllByRole, queryByText, waitForRegistry } =
			render(
				<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					features: [ 'freshData' ],
				}
			);

		await waitForRegistry();

		const tabs = getAllByRole( 'tab' );

		expect( tabs.map( ( tab ) => tab.textContent ) ).toEqual( [
			'Top content',
			'Latest content',
		] );
		expect( tabs[ 0 ] ).toHaveAttribute( 'aria-selected', 'true' );
		expect(
			container.querySelector( '.googlesitekit-widget__header' )
		).toBeNull();
		expect(
			queryByText( 'Top content over the last 28 days' )
		).not.toBeInTheDocument();
	} );

	it( 'should render the Latest content table when its tab is selected', async () => {
		const { getAllByRole, getByText, waitForRegistry } = render(
			<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		await act( async () => {
			fireEvent.click( getAllByRole( 'tab' )[ 1 ] );
			await waitForRegistry();
		} );

		expect( getAllByRole( 'tab' )[ 1 ] ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( getByText( 'Posted' ) ).toBeInTheDocument();
	} );
} );
