/**
 * Analytics SetupLayout component tests.
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
import { type Registry } from '@/js/googlesitekit-data';
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as analyticsFixtures from '@/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { act, fireEvent, render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import SetupLayout from './SetupLayout';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

jest.mock( '@/js/components/notifications/Notifications', () => () => null );

describe( 'Analytics SetupLayout', () => {
	mockLocation();

	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAudienceSettings( {} );

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModuleRegistrations( registry );

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );

		const {
			accountSummaries,
			webDataStreamsBatch,
			defaultEnhancedMeasurementSettings,
		} = analyticsFixtures;

		const accounts = accountSummaries.accountSummaries;
		const properties = accounts[ 1 ].propertySummaries;
		const accountID = accounts[ 1 ]._id;
		const propertyID = properties[ 0 ]
			._id as keyof typeof webDataStreamsBatch;
		const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAccountSummaries( accountSummaries );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getAccountSummaries', [] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( properties[ 0 ], {
				propertyID,
			} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreamsBatch( webDataStreamsBatch, {
				propertyIDs: [ propertyID ],
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getWebDataStreams', [ propertyID ] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...defaultEnhancedMeasurementSettings,
					streamEnabled: false,
				},
				{
					propertyID,
					webDataStreamID,
				}
			);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'isEnhancedMeasurementStreamAlreadyEnabled', [
				propertyID,
				webDataStreamID,
			] );

		registry.dispatch( MODULES_ANALYTICS_4 ).selectAccount( accountID );

		registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
			enabled: false,
		} );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
		jest.resetAllMocks();
	} );

	describe( 'initial setup flow', () => {
		it( 'renders initial setup-specific UI and classes', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&showProgress=true';

			const { container, queryByText, getByText, waitForRegistry } =
				render(
					<SetupLayout moduleSlug={ MODULE_SLUG_ANALYTICS_4 } />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MODULE_SETUP,
						features: [ 'setupFlowRefresh' ],
					}
				);

			await waitForRegistry();

			expect(
				container.querySelector( '.googlesitekit-progress-indicator' )
			).toBeInTheDocument();
			expect( queryByText( 'Connect Service' ) ).not.toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-setup__footer' )
			).not.toBeInTheDocument();
			expect( getByText( 'Exit setup' ) ).toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-initial-setup' )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					`.googlesitekit-initial-setup--${ MODULE_SLUG_ANALYTICS_4 }`
				)
			).toBeInTheDocument();
			expect( global.document.body ).toHaveClass(
				'googlesitekit-setup-flow'
			);
		} );

		it( 'tracks initial setup view and exit events', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&showProgress=true';

			const { getByText, waitForRegistry } = render(
				<SetupLayout moduleSlug={ MODULE_SLUG_ANALYTICS_4 } />,
				{
					registry,
					viewContext: VIEW_CONTEXT_MODULE_SETUP,
					features: [ 'setupFlowRefresh' ],
				}
			);

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MODULE_SETUP }_setup`,
				'setup_flow_v3_view_analytics_step',
				undefined,
				undefined
			);

			mockTrackEvent.mockClear();

			await act( () => {
				fireEvent.click( getByText( 'Exit setup' ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MODULE_SETUP }_setup`,
				'setup_flow_v3_exit_setup',
				MODULE_SLUG_ANALYTICS_4
			);
		} );
	} );

	it( 'renders the standard setup flow and tracks generic setup view event', async () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true';

		const { container, queryByText, getByText, waitForRegistry } = render(
			<SetupLayout moduleSlug={ MODULE_SLUG_ANALYTICS_4 } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
				features: [],
			}
		);

		await waitForRegistry();

		expect( queryByText( 'Exit setup' ) ).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-progress-indicator' )
		).not.toBeInTheDocument();
		expect( getByText( 'Connect Service' ) ).toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-setup__footer' )
		).toBeInTheDocument();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'moduleSetup',
			'view_module_setup',
			MODULE_SLUG_ANALYTICS_4,
			undefined
		);
	} );
} );
