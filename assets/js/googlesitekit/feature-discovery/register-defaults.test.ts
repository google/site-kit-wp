/**
 * Feature Discovery defaults tests.
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
import { Registry } from 'googlesitekit-data';
import { SETTINGS_DIALOG } from '@/js/components/dashboard-sharing/DashboardSharingSettings/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { PDF_DOWNLOAD_PANEL_OPENED_KEY } from '@/js/components/pdf-export/constants';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
} from '@tests/js/utils';
import { registerDefaults } from './register-defaults';

describe( 'registerDefaults', () => {
	it( 'registers the PDF report feature in the catalog', () => {
		const featureDiscoveryAPI = {
			registerFeature: jest.fn(),
			resetIncompleteSetupReminder: jest.fn(),
		};

		registerDefaults( featureDiscoveryAPI );

		const registeredSlugs =
			featureDiscoveryAPI.registerFeature.mock.calls.map(
				( [ slug ] ) => slug
			);

		expect( registeredSlugs ).toContain( 'pdf-report' );
	} );

	describe( 'in-place-panel features', () => {
		let registry: Registry;

		beforeEach( () => {
			registry = createTestRegistry() as Registry;

			registerDefaults( createFeatureDiscovery( registry ) );
		} );

		function isFeatureConnected( slug: string ) {
			return registry
				.select( CORE_FEATURE_DISCOVERY )
				.isFeatureConnected( slug );
		}

		it.each( [
			[ 'dashboard-sharing', SETTINGS_DIALOG ],
			[ 'email-reports', USER_SETTINGS_SELECTION_PANEL_OPENED_KEY ],
			[ 'pdf-report', PDF_DOWNLOAD_PANEL_OPENED_KEY ],
		] )(
			'should open the existing panel of the %s feature',
			( slug, uiKey ) => {
				const { setup } = registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeature( slug );

				expect( setup.type ).toBe( FEATURE_SETUP_TYPES.IN_PLACE_PANEL );
				expect( setup.ctaLabel ).toBe( 'Try it now' );

				setup.open( registry );

				expect( registry.select( CORE_UI ).getValue( uiKey ) ).toBe(
					true
				);
			}
		);

		describe( 'dashboard-sharing', () => {
			beforeEach( () => {
				provideModules( registry );
				registry
					.dispatch( CORE_MODULES )
					.receiveSharedOwnershipModules( [ 'search-console' ] );
			} );

			it( 'should not be connected while the sharing settings are the defaults', () => {
				registry.dispatch( CORE_MODULES ).receiveGetSharingSettings( {
					'search-console': {
						sharedRoles: [],
						management: 'all_admins',
					},
				} );

				expect( isFeatureConnected( 'dashboard-sharing' ) ).toBe(
					false
				);
			} );

			it( 'should be connected once the sharing settings have been modified and saved', () => {
				registry.dispatch( CORE_MODULES ).receiveGetSharingSettings( {
					'search-console': {
						sharedRoles: [ 'editor' ],
						management: 'all_admins',
					},
				} );

				expect( isFeatureConnected( 'dashboard-sharing' ) ).toBe(
					true
				);
			} );

			it( 'should not be connected by sharing settings that are modified but not saved', () => {
				registry.dispatch( CORE_MODULES ).receiveGetSharingSettings( {
					'search-console': {
						sharedRoles: [],
						management: 'all_admins',
					},
				} );
				registry
					.dispatch( CORE_MODULES )
					.setSharedRoles( 'search-console', [ 'editor' ] );

				expect( isFeatureConnected( 'dashboard-sharing' ) ).toBe(
					false
				);
			} );
		} );

		describe( 'email-reports', () => {
			it( 'should not be connected while the user is not subscribed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( { subscribed: false } );

				expect( isFeatureConnected( 'email-reports' ) ).toBe( false );
			} );

			it( 'should be connected once the user is subscribed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetEmailReportingSettings( { subscribed: true } );

				expect( isFeatureConnected( 'email-reports' ) ).toBe( true );
			} );

			it( 'should be unresolved while the user’s settings are loading', () => {
				freezeFetch(
					new RegExp(
						'^/google-site-kit/v1/core/user/data/email-reporting-settings'
					)
				);

				expect( isFeatureConnected( 'email-reports' ) ).toBeUndefined();
			} );
		} );

		describe( 'pdf-report', () => {
			it( 'should never be counted as set up', () => {
				const { setup } = registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeature( 'pdf-report' );

				expect( setup.isEnabled ).toBeUndefined();
				expect( isFeatureConnected( 'pdf-report' ) ).toBe( false );
			} );
		} );
	} );
} );
