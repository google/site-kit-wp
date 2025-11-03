/**
 * ModuleSetup component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { render } from '../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as analyticsFixtures from '@/js/modules/analytics-4/datastore/__fixtures__';
import ModuleSetup from './ModuleSetup';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

describe( 'ModuleSetup', () => {
	mockLocation();

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {} );

		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModuleRegistrations( registry );
	} );

	describe( 'Analytics 4', () => {
		beforeEach( () => {
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
			const propertyID = properties[ 0 ]._id;
			const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				adsConversionID: '',
			} );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetExistingTag( null );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetAccountSummaries( accountSummaries );
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

			registry.dispatch( MODULES_ANALYTICS_4 ).selectAccount( accountID );

			registry
				.dispatch( CORE_SITE )
				.receiveGetConversionTrackingSettings( {
					enabled: false,
				} );
		} );
		describe( 'initial setup flow', () => {
			let container, waitForRegistry, queryByText, getByText;

			beforeEach( async () => {
				global.location.href =
					'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&showProgress=true';
				( { container, waitForRegistry, queryByText, getByText } =
					render(
						<ModuleSetup moduleSlug={ MODULE_SLUG_ANALYTICS_4 } />,
						{
							registry,
							viewContext: VIEW_CONTEXT_MODULE_SETUP,
							features: [ 'setupFlowRefresh' ],
						}
					) );
				await waitForRegistry();
			} );

			it( 'should display an exit button', () => {
				expect( getByText( 'Exit setup' ) ).toBeInTheDocument();
			} );
			it( 'should display the progress indicator', () => {
				expect(
					container.querySelector(
						'.googlesitekit-progress-indicator'
					)
				).toBeInTheDocument();
			} );
			it( 'should not display the help button', () => {
				expect(
					container.querySelector(
						'.googlesitekit-help-menu__button'
					)
				).not.toBeInTheDocument();
			} );
			it( 'should not display the "Connect Service" line', () => {
				expect(
					queryByText( 'Connect Service' )
				).not.toBeInTheDocument();
			} );
			it( 'should not display the setup footer', () => {
				expect(
					container.querySelector( '.googlesitekit-setup__footer' )
				).not.toBeInTheDocument();
			} );
			it( 'should match the snpashot', () => {
				expect( container ).toMatchSnapshot();
			} );
		} );
		describe( 'not initial setup flow', () => {
			let container, waitForRegistry, queryByText, getByText;

			beforeEach( async () => {
				global.location.href =
					'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true';
				( { container, waitForRegistry, queryByText, getByText } =
					render(
						<ModuleSetup moduleSlug={ MODULE_SLUG_ANALYTICS_4 } />,
						{
							registry,
							viewContext: VIEW_CONTEXT_MODULE_SETUP,
							features: [],
						}
					) );
				await waitForRegistry();
			} );

			it( 'should not display an exit button', () => {
				expect( queryByText( 'Exit setup' ) ).not.toBeInTheDocument();
			} );
			it( 'should not display the progress indicator', () => {
				expect(
					container.querySelector(
						'.googlesitekit-progress-indicator'
					)
				).not.toBeInTheDocument();
			} );
			it( 'should display the help button', () => {
				expect(
					container.querySelector(
						'.googlesitekit-help-menu__button'
					)
				).toBeInTheDocument();
			} );
			it( 'should display the "Connect Service" line', () => {
				expect( getByText( 'Connect Service' ) ).toBeInTheDocument();
			} );
			it( 'should display the setup footer', () => {
				expect(
					container.querySelector( '.googlesitekit-setup__footer' )
				).toBeInTheDocument();
			} );
			it( 'should match the snpashot', () => {
				expect( container ).toMatchSnapshot();
			} );
		} );
	} );

	it( 'renders all elements correctly', () => {
		provideModules( registry );

		registry.dispatch( CORE_MODULES ).registerModule( 'test-module', {
			storeName: 'modules/test-module',
			SetupComponent: () => <div>Test module setup component</div>,
		} );

		const { container, getByText } = render(
			<ModuleSetup moduleSlug="test-module" />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MODULE_SETUP,
			}
		);

		expect(
			getByText( 'Test module setup component' )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-header' )
		).toBeInTheDocument();

		expect(
			container.querySelector( '.googlesitekit-setup__footer' )
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );
} );
