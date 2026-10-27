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
import { provideRecentContent } from '@/js/modules/analytics-4/datastore/test-utils';
import * as tracking from '@/js/util/tracking';
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
import {
	LATEST_CONTENT_RECENT_CONTENT_OPTIONS,
	LATEST_CONTENT_TAB_ID,
} from './constants';
import ModulePopularPagesWidgetGA4 from '.';

describe( 'ModulePopularPagesWidgetGA4', () => {
	let registry: WPDataRegistry;

	const widgetComponentProps = getWidgetComponentProps(
		'analyticsModulePopularPagesGA4'
	);

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	beforeEach( () => {
		mockTrackEvent.mockClear();

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
		provideRecentContent(
			registry,
			[],
			LATEST_CONTENT_RECENT_CONTENT_OPTIONS
		);
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

	it( 'should render the tabs with the Top content header title when freshData is enabled', async () => {
		const { getAllByRole, getByRole, getByText, waitForRegistry } = render(
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
			getByText( 'Top content over the last 28 days' )
		).toBeInTheDocument();
		expect( getByRole( 'tabpanel' ) ).toHaveAttribute(
			'aria-labelledby',
			'googlesitekit-top-content-tab'
		);
	} );

	it( 'should switch the panel and the header title when the Latest content tab is selected', async () => {
		const {
			getAllByRole,
			getByRole,
			getByText,
			queryByText,
			waitForRegistry,
		} = render(
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
		expect(
			getByText( 'Latest content performance over the last 28 days' )
		).toBeInTheDocument();
		expect(
			queryByText( 'Top content over the last 28 days' )
		).not.toBeInTheDocument();
		expect( getByRole( 'tabpanel' ) ).toHaveAttribute(
			'aria-labelledby',
			'googlesitekit-latest-content-tab'
		);
		expect( getByText( 'Posted' ) ).toBeInTheDocument();
	} );

	it( 'should keep the same tab element focused when the tab changes', async () => {
		const { getAllByRole, waitForRegistry } = render(
			<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		const latestContentTab = getAllByRole( 'tab' )[ 1 ];

		await act( async () => {
			latestContentTab.focus();
			fireEvent.click( latestContentTab );
			await waitForRegistry();
		} );

		expect( getAllByRole( 'tab' )[ 1 ] ).toBe( latestContentTab );
		expect( latestContentTab ).toHaveFocus();
	} );

	it( 'should select the Latest content tab when it is the active content tab before the first render', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setActiveContentTab( LATEST_CONTENT_TAB_ID );

		const { getAllByRole, getByRole, waitForRegistry } = render(
			<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		expect( getAllByRole( 'tab' )[ 1 ] ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( getByRole( 'tabpanel' ) ).toHaveAttribute(
			'aria-labelledby',
			'googlesitekit-latest-content-tab'
		);
	} );

	it( 'should select the Latest content tab when it becomes the active content tab after the first render', async () => {
		const { getAllByRole, getByRole, waitForRegistry } = render(
			<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
		).toBe( 'googlesitekit-top-content-tab' );
		expect( getAllByRole( 'tab' )[ 0 ] ).toHaveAttribute(
			'aria-selected',
			'true'
		);

		await act( async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setActiveContentTab( LATEST_CONTENT_TAB_ID );
			await waitForRegistry();
		} );

		expect( getAllByRole( 'tab' )[ 1 ] ).toHaveAttribute(
			'aria-selected',
			'true'
		);
		expect( getByRole( 'tabpanel' ) ).toHaveAttribute(
			'aria-labelledby',
			'googlesitekit-latest-content-tab'
		);
	} );

	it( 'should set the active content tab to the tab the user selects', async () => {
		const { getAllByRole, waitForRegistry } = render(
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

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
		).toBe( 'googlesitekit-latest-content-tab' );

		await act( async () => {
			fireEvent.click( getAllByRole( 'tab' )[ 0 ] );
			await waitForRegistry();
		} );

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
		).toBe( 'googlesitekit-top-content-tab' );
	} );

	it( 'should track `change_tab` labeled `googlesitekit-latest-content-tab` when the user selects the Latest content tab', async () => {
		const { getByRole, waitForRegistry } = render(
			<ModulePopularPagesWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'freshData' ],
			}
		);

		await waitForRegistry();

		await act( async () => {
			fireEvent.click( getByRole( 'tab', { name: 'Latest content' } ) );
			await waitForRegistry();
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_content-tabs',
			'change_tab',
			'googlesitekit-latest-content-tab'
		);
	} );
} );
