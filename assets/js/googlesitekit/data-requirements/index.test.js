/**
 * Data requirements tests.
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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
	PERMISSION_UPDATE_PLUGINS,
	WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
	WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	setEnabledFeatures,
} from '@tests/js/test-utils';
import {
	requireAccessToFeatureTour,
	requireAdsConnected,
	requireAnyGoogleTagGatewayModuleConnected,
	requireAuthError,
	requireCanChangePluginAutoUpdates,
	requireCapability,
	requireConsentModeDisabled,
	requireDataGatheringCompleteModalActive,
	requireEmailReportingSubscribed,
	requireGTGHealthy,
	requireGTGScriptAccessEnabled,
	requireGoogleTagGatewayEnabled,
	requireHasRecoverableModules,
	requireModuleRecoverable,
	requireModuleViewable,
	requireModuleZeroData,
	requireQueryArg,
	requireSetupError,
	requireSiteEmailReportingNotDisabled,
	requireSiteKitAutoUpdatesEnabled,
	requireUnsatisfiedScopes,
	requireUnsatisfiedScopesCount,
	requireViewOnlyContext,
} from './index';

describe( 'data requirements', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'requireCapability', () => {
		it( 'should return true when the user has the capability', async () => {
			provideUserCapabilities( registry, {
				[ PERMISSION_UPDATE_PLUGINS ]: true,
			} );

			expect(
				await requireCapability( PERMISSION_UPDATE_PLUGINS )( registry )
			).toBe( true );
		} );

		it( 'should return false when the user does not have the capability', async () => {
			provideUserCapabilities( registry, {
				[ PERMISSION_UPDATE_PLUGINS ]: false,
			} );

			expect(
				await requireCapability( PERMISSION_UPDATE_PLUGINS )( registry )
			).toBe( false );
		} );

		it( 'should return false when the capability is not present at all', async () => {
			provideUserCapabilities( registry );

			expect(
				await requireCapability( PERMISSION_UPDATE_PLUGINS )( registry )
			).toBe( false );
		} );
	} );

	describe( 'requireUnsatisfiedScopes', () => {
		it( 'should return true when there are unsatisfied scopes', async () => {
			provideUserAuthentication( registry, {
				unsatisfiedScopes: [ 'https://example.com/test/scope' ],
			} );

			expect( await requireUnsatisfiedScopes()( registry ) ).toBe( true );
		} );

		it( 'should return false when there are no unsatisfied scopes', async () => {
			provideUserAuthentication( registry, { unsatisfiedScopes: [] } );

			expect( await requireUnsatisfiedScopes()( registry ) ).toBe(
				false
			);
		} );

		it( 'should return false when the unsatisfied scopes are not available', async () => {
			provideUserAuthentication( registry, {
				unsatisfiedScopes: undefined,
			} );

			expect( await requireUnsatisfiedScopes()( registry ) ).toBe(
				false
			);
		} );
	} );

	describe( 'requireUnsatisfiedScopesCount', () => {
		it( 'should return true when the number of unsatisfied scopes matches', async () => {
			provideUserAuthentication( registry, {
				unsatisfiedScopes: [ 'https://example.com/test/scope' ],
			} );

			expect( await requireUnsatisfiedScopesCount( 1 )( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false when the number of unsatisfied scopes does not match', async () => {
			provideUserAuthentication( registry, {
				unsatisfiedScopes: [
					'https://example.com/test/scope',
					'https://example.com/test/scope-2',
				],
			} );

			expect( await requireUnsatisfiedScopesCount( 1 )( registry ) ).toBe(
				false
			);
		} );

		it( 'should return false when the unsatisfied scopes are not available', async () => {
			provideUserAuthentication( registry, {
				unsatisfiedScopes: undefined,
			} );

			expect( await requireUnsatisfiedScopesCount( 1 )( registry ) ).toBe(
				false
			);
		} );
	} );

	describe( 'requireAuthError', () => {
		it( 'should return true when there is an authentication error', () => {
			registry.dispatch( CORE_USER ).setAuthError( {
				code: 'test-error',
				message: 'Test error',
				data: {},
			} );

			expect( requireAuthError()( registry ) ).toBe( true );
		} );

		it( 'should return false when there is no authentication error', () => {
			expect( requireAuthError()( registry ) ).toBe( false );
		} );
	} );

	describe( 'requireAccessToFeatureTour', () => {
		it( 'should return true for an authenticated user with an available module', async () => {
			provideModules( registry );
			provideUserAuthentication( registry );
			provideUserCapabilities( registry );

			expect( await requireAccessToFeatureTour()( registry ) ).toBe(
				true
			);
		} );

		it( 'should return true for a view-only user who can view a shared module', async () => {
			provideModules( registry, [
				{ slug: MODULE_SLUG_SEARCH_CONSOLE, shareable: true },
			] );
			provideUserAuthentication( registry, { authenticated: false } );
			provideUserCapabilities( registry, {
				[ getMetaCapabilityPropertyName(
					PERMISSION_READ_SHARED_MODULE_DATA,
					MODULE_SLUG_SEARCH_CONSOLE
				) ]: true,
			} );

			expect( await requireAccessToFeatureTour()( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false for a view-only user without shared module access', async () => {
			provideModules( registry );
			provideUserAuthentication( registry, { authenticated: false } );
			provideUserCapabilities( registry );

			expect( await requireAccessToFeatureTour()( registry ) ).toBe(
				false
			);
		} );
	} );

	describe( 'requireDataGatheringCompleteModalActive', () => {
		it( 'should return true when the gathering data item is dismissed and the tour item is not', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
				] );

			expect(
				await requireDataGatheringCompleteModalActive()( registry )
			).toBe( true );
		} );

		it( 'should return false when the tour item is also dismissed', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
					WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
				] );

			expect(
				await requireDataGatheringCompleteModalActive()( registry )
			).toBe( false );
		} );

		it( 'should return false when no items are dismissed', async () => {
			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			expect(
				await requireDataGatheringCompleteModalActive()( registry )
			).toBe( false );
		} );
	} );

	describe( 'requireEmailReportingSubscribed', () => {
		it( 'should return true when the user is subscribed', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetEmailReportingSettings( { subscribed: true } );

			expect( await requireEmailReportingSubscribed()( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false when the user is not subscribed', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetEmailReportingSettings( { subscribed: false } );

			expect( await requireEmailReportingSubscribed()( registry ) ).toBe(
				false
			);
		} );
	} );

	describe( 'requireSetupError', () => {
		it( 'should return true when there is a setup error message', async () => {
			provideSiteInfo( registry, {
				setupErrorMessage: 'Something went wrong',
			} );

			expect( await requireSetupError()( registry ) ).toBe( true );
		} );

		it( 'should return false when there is no setup error message', async () => {
			provideSiteInfo( registry );

			expect( await requireSetupError()( registry ) ).toBe( false );
		} );
	} );

	describe( 'requireConsentModeDisabled', () => {
		it( 'should return true when consent mode is disabled', async () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetConsentModeSettings( { enabled: false } );

			expect( await requireConsentModeDisabled()( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false when consent mode is enabled', async () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetConsentModeSettings( { enabled: true } );

			expect( await requireConsentModeDisabled()( registry ) ).toBe(
				false
			);
		} );

		it( 'should return false when the consent mode state is unknown', async () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetConsentModeSettings( { enabled: undefined } );

			expect( await requireConsentModeDisabled()( registry ) ).toBe(
				false
			);
		} );
	} );

	describe( 'requireAdsConnected', () => {
		it( 'should return true when Ads is connected', async () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetAdsMeasurementStatus(
					{ connected: true },
					{ useCache: true }
				);

			expect( await requireAdsConnected()( registry ) ).toBe( true );
		} );

		it( 'should return false when Ads is not connected', async () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetAdsMeasurementStatus(
					{ connected: false },
					{ useCache: true }
				);

			expect( await requireAdsConnected()( registry ) ).toBe( false );
		} );
	} );

	describe( 'requireCanChangePluginAutoUpdates', () => {
		it( 'should return true when auto-updates can be changed', async () => {
			provideSiteInfo( registry, {
				changePluginAutoUpdatesCapacity: true,
			} );

			expect(
				await requireCanChangePluginAutoUpdates()( registry )
			).toBe( true );
		} );

		it( 'should return false when auto-updates cannot be changed', async () => {
			provideSiteInfo( registry, {
				changePluginAutoUpdatesCapacity: false,
			} );

			expect(
				await requireCanChangePluginAutoUpdates()( registry )
			).toBe( false );
		} );
	} );

	describe( 'requireSiteKitAutoUpdatesEnabled', () => {
		it( 'should return true when Site Kit auto-updates are enabled', async () => {
			provideSiteInfo( registry, { siteKitAutoUpdatesEnabled: true } );

			expect( await requireSiteKitAutoUpdatesEnabled()( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false when Site Kit auto-updates are disabled', async () => {
			provideSiteInfo( registry, { siteKitAutoUpdatesEnabled: false } );

			expect( await requireSiteKitAutoUpdatesEnabled()( registry ) ).toBe(
				false
			);
		} );
	} );

	describe( 'requireAnyGoogleTagGatewayModuleConnected', () => {
		beforeEach( () => {
			setEnabledFeatures( [ 'googleTagGateway' ] );
		} );

		it( 'should return true when a Google Tag Gateway module is connected', () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			expect(
				requireAnyGoogleTagGatewayModuleConnected()( registry )
			).toBe( true );
		} );

		it( 'should return false when no Google Tag Gateway module is connected', () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: false,
					connected: false,
				},
			] );

			expect(
				requireAnyGoogleTagGatewayModuleConnected()( registry )
			).toBe( false );
		} );

		it( 'should return false when the Google Tag Gateway feature is disabled', () => {
			setEnabledFeatures( [] );

			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: true,
				},
			] );

			expect(
				requireAnyGoogleTagGatewayModuleConnected()( registry )
			).toBe( false );
		} );
	} );

	describe( 'Google Tag Gateway settings requirements', () => {
		function provideGTGSettings( settings ) {
			registry
				.dispatch( CORE_SITE )
				.receiveGetGoogleTagGatewaySettings( settings );
		}

		it.each( [
			[
				'requireGoogleTagGatewayEnabled',
				requireGoogleTagGatewayEnabled,
			],
			[ 'requireGTGHealthy', requireGTGHealthy ],
			[ 'requireGTGScriptAccessEnabled', requireGTGScriptAccessEnabled ],
		] )(
			'%s should return true when its setting is true',
			async ( _name, requirement ) => {
				provideGTGSettings( {
					isEnabled: true,
					isGTGHealthy: true,
					isScriptAccessEnabled: true,
				} );

				expect( await requirement()( registry ) ).toBe( true );
			}
		);

		it.each( [
			[
				'requireGoogleTagGatewayEnabled',
				requireGoogleTagGatewayEnabled,
			],
			[ 'requireGTGHealthy', requireGTGHealthy ],
			[ 'requireGTGScriptAccessEnabled', requireGTGScriptAccessEnabled ],
		] )(
			'%s should return false when its setting is false',
			async ( _name, requirement ) => {
				provideGTGSettings( {
					isEnabled: false,
					isGTGHealthy: false,
					isScriptAccessEnabled: false,
				} );

				expect( await requirement()( registry ) ).toBe( false );
			}
		);

		it.each( [
			[ 'requireGTGHealthy', requireGTGHealthy ],
			[ 'requireGTGScriptAccessEnabled', requireGTGScriptAccessEnabled ],
		] )(
			'%s should return false for the unresolved `null` tri-state',
			async ( _name, requirement ) => {
				provideGTGSettings( {
					isEnabled: false,
					isGTGHealthy: null,
					isScriptAccessEnabled: null,
				} );

				expect( await requirement()( registry ) ).toBe( false );
			}
		);
	} );

	describe( 'requireSiteEmailReportingNotDisabled', () => {
		it( 'should return true when email reporting is enabled', async () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetEmailReportingSettings( { enabled: true } );

			expect(
				await requireSiteEmailReportingNotDisabled()( registry )
			).toBe( true );
		} );

		it( 'should return false when email reporting is disabled', async () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetEmailReportingSettings( { enabled: false } );

			expect(
				await requireSiteEmailReportingNotDisabled()( registry )
			).toBe( false );
		} );

		it( 'should return true when the email reporting state is unknown', async () => {
			registry
				.dispatch( CORE_SITE )
				.receiveGetEmailReportingSettings( { enabled: undefined } );

			expect(
				await requireSiteEmailReportingNotDisabled()( registry )
			).toBe( true );
		} );
	} );

	describe( 'requireViewOnlyContext', () => {
		it( 'should return true in a view-only context', () => {
			expect(
				requireViewOnlyContext()(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY
				)
			).toBe( true );
		} );

		it( 'should return false in an authenticated context', () => {
			expect(
				requireViewOnlyContext()(
					registry,
					VIEW_CONTEXT_MAIN_DASHBOARD
				)
			).toBe( false );
		} );
	} );

	describe( 'requireModuleViewable', () => {
		it( 'should return true when the module is shared with the user', async () => {
			provideModules( registry, [
				{ slug: MODULE_SLUG_SEARCH_CONSOLE, shareable: true },
			] );
			provideUserCapabilities( registry, {
				[ getMetaCapabilityPropertyName(
					PERMISSION_READ_SHARED_MODULE_DATA,
					MODULE_SLUG_SEARCH_CONSOLE
				) ]: true,
			} );

			expect(
				await requireModuleViewable( MODULE_SLUG_SEARCH_CONSOLE )(
					registry
				)
			).toBe( true );
		} );

		it( 'should return false when the module is not shared with the user', async () => {
			provideModules( registry, [
				{ slug: MODULE_SLUG_SEARCH_CONSOLE, shareable: true },
			] );
			provideUserCapabilities( registry );

			expect(
				await requireModuleViewable( MODULE_SLUG_SEARCH_CONSOLE )(
					registry
				)
			).toBe( false );
		} );
	} );

	describe( 'requireModuleRecoverable', () => {
		it( 'should return true when the module is recoverable', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					recoverable: true,
				},
			] );

			expect(
				await requireModuleRecoverable( MODULE_SLUG_ANALYTICS_4 )(
					registry
				)
			).toBe( true );
		} );

		it( 'should return false when the module is not recoverable', async () => {
			provideModules( registry );

			expect(
				await requireModuleRecoverable( MODULE_SLUG_ANALYTICS_4 )(
					registry
				)
			).toBe( false );
		} );
	} );

	describe( 'requireHasRecoverableModules', () => {
		it( 'should return true when there is at least one recoverable module', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					recoverable: true,
				},
			] );

			expect( await requireHasRecoverableModules()( registry ) ).toBe(
				true
			);
		} );

		it( 'should return false when there are no recoverable modules', async () => {
			provideModules( registry );

			expect( await requireHasRecoverableModules()( registry ) ).toBe(
				false
			);
		} );
	} );

	describe( 'requireModuleZeroData', () => {
		function provideSearchConsoleReport( report ) {
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveIsGatheringData( false );

			const options = registry
				.select( MODULES_SEARCH_CONSOLE )
				.getSampleReportArgs();

			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.receiveGetReport( report, { options } );
			registry
				.dispatch( MODULES_SEARCH_CONSOLE )
				.finishResolution( 'getReport', [ options ] );
		}

		beforeEach( () => {
			provideSiteInfo( registry );
		} );

		it( 'should return true when the module has zero data', async () => {
			provideSearchConsoleReport( [] );

			expect(
				await requireModuleZeroData( MODULES_SEARCH_CONSOLE )(
					registry
				)
			).toBe( true );
		} );

		it( 'should return false when the module has data', async () => {
			provideSearchConsoleReport( [
				{
					clicks: 100,
					ctr: 0.5,
					impressions: 200,
					keys: [ '2024-01-01' ],
					position: 1,
				},
			] );

			expect(
				await requireModuleZeroData( MODULES_SEARCH_CONSOLE )(
					registry
				)
			).toBe( false );
		} );
	} );

	describe( 'requireQueryArg', () => {
		let oldLocation;

		beforeAll( () => {
			oldLocation = global.location;
			delete global.location;
			global.location = { href: 'http://example.com/wp-admin/admin.php' };
		} );

		afterAll( () => {
			global.location = oldLocation;
		} );

		it( 'should return true when the query argument matches the given value', () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success';

			expect(
				requireQueryArg( 'notification', 'authentication_success' )()
			).toBe( true );
		} );

		it( 'should return false when the query argument does not match the given value', () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=other';

			expect(
				requireQueryArg( 'notification', 'authentication_success' )()
			).toBe( false );
		} );

		it( 'should return false when the query argument is absent', () => {
			global.location.href = 'http://example.com/wp-admin/admin.php';

			expect(
				requireQueryArg( 'notification', 'authentication_success' )()
			).toBe( false );
		} );

		it( 'should return true when no value is given and the query argument is present', () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?slug=analytics-4';

			expect( requireQueryArg( 'slug' )() ).toBe( true );
		} );

		it( 'should return false when no value is given and the query argument is absent', () => {
			global.location.href = 'http://example.com/wp-admin/admin.php';

			expect( requireQueryArg( 'slug' )() ).toBe( false );
		} );
	} );
} );
