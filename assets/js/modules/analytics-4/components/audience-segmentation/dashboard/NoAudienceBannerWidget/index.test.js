/**
 * NoAudienceBannerWidget component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * External dependencies
 */
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * Internal dependencies
 */
import NoAudienceBannerWidget from '.';
import { fireEvent, render } from '../../../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '../../../../../../../../tests/js/utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../../googlesitekit/constants';
import { CORE_UI } from '../../../../../../googlesitekit/datastore/ui/constants';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../../datastore/constants';
import { withWidgetComponentProps } from '../../../../../../googlesitekit/widgets/util';
import { availableAudiences } from '../../../../datastore/__fixtures__';
import * as tracking from '../../../../../../util/tracking';
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from '../AudienceSelectionPanel/constants';
import { mockLocation } from '../../../../../../../../tests/js/mock-browser-utils';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'NoAudienceBannerWidget', () => {
	mockLocation();

	let registry;

	const WidgetWithComponentProps = withWidgetComponentProps(
		'analyticsNoAudienceBanner'
	)( NoAudienceBannerWidget );

	const audienceSettingsRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/audience-settings'
	);

	beforeEach( () => {
		mockUseIntersection.mockImplementation( () => ( {
			isIntersecting: false,
			intersectionRatio: 0,
		} ) );

		registry = createTestRegistry();
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics-4',
			},
		] );
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should not render when configuredAudiences is not loaded', () => {
		muteFetch( audienceSettingsRegExp );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when configuredAudiences is null (not set)', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: null,
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when configured audience is matching available audiences', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [ 'properties/12345/audiences/1' ],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when all configured audiences are matching available audiences', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [
				'properties/12345/audiences/1',
				'properties/12345/audiences/3',
			],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render when some configured audiences are matching available audiences', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setAvailableAudiences( availableAudiences );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			configuredAudiences: [
				'properties/12345/audiences/1',
				'properties/12345/audiences/9',
			],
			isAudienceSegmentationWidgetHidden: false,
		} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	describe( "with an authenticated user who's never populated their audience selection", () => {
		let container, getByRole, getByText, rerender;

		beforeEach( () => {
			provideSiteInfo( registry );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( availableAudiences );

			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: [],
				didSetAudiences: false,
			} );

			( { container, getByRole, getByText, rerender } = render(
				<WidgetWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			) );
		} );

		it( 'should render correctly.', () => {
			expect(
				getByText( /You don’t have any visitor groups selected./i )
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should open the Audience Selection Panel when clicking on "Select groups"', async () => {
			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBeUndefined();

			fireEvent.click( getByRole( 'button', { name: 'Select groups' } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );
		} );

		it( 'should redirect to the settings page when clicking on "Settings"', async () => {
			expect( global.location.assign ).not.toHaveBeenCalled();

			fireEvent.click( getByRole( 'button', { name: 'Settings' } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect( global.location.assign ).toHaveBeenCalledWith(
				'http://example.com/wp-admin/admin.php?page=googlesitekit-settings#/admin-settings'
			);
		} );

		it( 'should track an event when the banner is viewed', () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <WidgetWithComponentProps /> );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-no-audiences',
				'view_banner',
				'none-selected'
			);
		} );

		it( 'should track an event when clicking on "Select groups"', async () => {
			fireEvent.click( getByRole( 'button', { name: 'Select groups' } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-no-audiences',
				'select_groups',
				'none-selected'
			);
		} );

		it( 'should track an event when clicking on "Settings"', async () => {
			fireEvent.click( getByRole( 'button', { name: 'Settings' } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-no-audiences',
				'change_settings',
				'none-selected'
			);
		} );
	} );

	describe( "with an authenticated user who's previously populated their audience selection", () => {
		let container, getByRole, getByText, rerender;

		beforeEach( () => {
			provideSiteInfo( registry );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( availableAudiences );

			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: [],
				didSetAudiences: true,
			} );

			( { container, getByRole, getByText, rerender } = render(
				<WidgetWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			) );
		} );

		it( 'should render correctly.', () => {
			expect(
				getByText(
					/It looks like your visitor groups aren’t available anymore./i
				)
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should open the Audience Selection Panel when clicking on "Select other groups"', async () => {
			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBeUndefined();

			fireEvent.click(
				getByRole( 'button', { name: 'Select other groups' } )
			);

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );
		} );

		it( 'should redirect to the settings page when clicking on "Settings"', async () => {
			expect( global.location.assign ).not.toHaveBeenCalled();

			fireEvent.click( getByRole( 'button', { name: 'Settings' } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect( global.location.assign ).toHaveBeenCalledWith(
				'http://example.com/wp-admin/admin.php?page=googlesitekit-settings#/admin-settings'
			);
		} );

		it( 'should track an event when the banner is viewed', () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <WidgetWithComponentProps /> );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-no-audiences',
				'view_banner',
				'no-longer-available'
			);
		} );

		it( 'should track an event when clicking on "Select other groups"', async () => {
			fireEvent.click(
				getByRole( 'button', { name: 'Select other groups' } )
			);

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-no-audiences',
				'select_groups',
				'no-longer-available'
			);
		} );

		it( 'should track an event when clicking on "Settings"', async () => {
			fireEvent.click( getByRole( 'button', { name: 'Settings' } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboard_audiences-no-audiences',
				'change_settings',
				'no-longer-available'
			);
		} );
	} );

	describe( "with a view-only user who's never populated their audience selection", () => {
		let container, getByRole, getByText, rerender;

		beforeEach( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( availableAudiences );

			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: [],
				didSetAudiences: false,
			} );

			( { container, getByRole, getByText, rerender } = render(
				<WidgetWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				}
			) );
		} );

		it( 'should render correctly.', () => {
			expect(
				getByText( /You don’t have any visitor groups selected./i )
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should open the Audience Selection Panel when clicking on "Select groups"', async () => {
			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBeUndefined();

			fireEvent.click( getByRole( 'button', { name: 'Select groups' } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );
		} );

		it( 'should track an event when the banner is viewed', () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <WidgetWithComponentProps /> );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboardViewOnly_audiences-no-audiences',
				'view_banner',
				'none-selected'
			);
		} );

		it( 'should track an event when clicking on "Select groups"', async () => {
			fireEvent.click( getByRole( 'button', { name: 'Select groups' } ) );

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboardViewOnly_audiences-no-audiences',
				'select_groups',
				'none-selected'
			);
		} );
	} );

	describe( "with a view-only user who's previously populated their audience selection", () => {
		let container, getByRole, getByText, rerender;

		beforeEach( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( availableAudiences );

			registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
				configuredAudiences: [],
				didSetAudiences: true,
			} );

			( { container, getByRole, getByText, rerender } = render(
				<WidgetWithComponentProps />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				}
			) );
		} );

		it( 'should render correctly.', () => {
			expect(
				getByText(
					/It looks like your visitor groups aren’t available anymore./i
				)
			).toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );

		it( 'should open the Audience Selection Panel when clicking on "Select other groups"', async () => {
			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBeUndefined();

			fireEvent.click(
				getByRole( 'button', { name: 'Select other groups' } )
			);

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect(
				registry
					.select( CORE_UI )
					.getValue( AUDIENCE_SELECTION_PANEL_OPENED_KEY )
			).toBe( true );
		} );

		it( 'should track an event when the banner is viewed', () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

			// Simulate the CTA becoming visible.
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );

			rerender( <WidgetWithComponentProps /> );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboardViewOnly_audiences-no-audiences',
				'view_banner',
				'no-longer-available'
			);
		} );

		it( 'should track an event when clicking on "Select other groups"', async () => {
			fireEvent.click(
				getByRole( 'button', { name: 'Select other groups' } )
			);

			// Allow the `trackEvent()` promise to resolve.
			await waitForDefaultTimeouts();

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				'mainDashboardViewOnly_audiences-no-audiences',
				'select_groups',
				'no-longer-available'
			);
		} );
	} );
} );
