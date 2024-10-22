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
import { AUDIENCE_SELECTION_PANEL_OPENED_KEY } from '../AudienceSelectionPanel/constants';
import { mockLocation } from '../../../../../../../../tests/js/mock-browser-utils';

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

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
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

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
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

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
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

		registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
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
		let container, getByRole, getByText;

		beforeEach( () => {
			provideSiteInfo( registry );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( availableAudiences );

			registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
				configuredAudiences: [],
				didSetAudiences: false,
			} );

			( { container, getByRole, getByText } = render(
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
	} );

	describe( "with an authenticated user who's previously populated their audience selection", () => {
		let container, getByRole, getByText;

		beforeEach( () => {
			provideSiteInfo( registry );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( availableAudiences );

			registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
				configuredAudiences: [],
				didSetAudiences: true,
			} );

			( { container, getByRole, getByText } = render(
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
	} );

	describe( "with a view-only user who's never populated their audience selection", () => {
		let container, getByRole, getByText;

		beforeEach( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( availableAudiences );

			registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
				configuredAudiences: [],
				didSetAudiences: false,
			} );

			( { container, getByRole, getByText } = render(
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
	} );

	describe( "with a view-only user who's previously populated their audience selection", () => {
		let container, getByRole, getByText;

		beforeEach( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setAvailableAudiences( availableAudiences );

			registry.dispatch( CORE_USER ).receiveGetAudienceSettings( {
				configuredAudiences: [],
				didSetAudiences: true,
			} );

			( { container, getByRole, getByText } = render(
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
	} );
} );
