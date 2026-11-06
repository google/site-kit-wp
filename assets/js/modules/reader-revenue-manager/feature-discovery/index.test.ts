/**
 * Reader Revenue Manager Feature Discovery registrations tests.
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
import { enabledFeatures } from '@/js/features';
import { CORE_FEATURE_DISCOVERY } from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { createFeatureDiscovery } from '@/js/googlesitekit/feature-discovery';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { createTestRegistryWithFeatures } from '@tests/js/feature-flag-utils';
import {
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '@tests/js/utils';
import { registerFeatures } from './index';

describe( 'Reader Revenue Manager feature discovery', () => {
	let registry: Registry;

	beforeEach( () => {
		// `registerFeatures()` reads this instance, not the one reloaded by
		// `createTestRegistryWithFeatures()`.
		enabledFeatures.add( 'rrmExpressSetup' );
		registry = createTestRegistryWithFeatures( [
			'rrmExpressSetup',
		] ) as Registry;
		provideSiteInfo( registry );
		registerFeatures( createFeatureDiscovery( registry ) );
	} );

	afterEach( () => {
		enabledFeatures.delete( 'rrmExpressSetup' );
	} );

	function provideRRM( active: boolean ) {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_READER_REVENUE_MANAGER,
				active,
				connected: active,
			},
		] );
	}

	function isNewsletterFeatureConnected() {
		return registry
			.select( CORE_FEATURE_DISCOVERY )
			.isFeatureConnected( 'newsletter-signup' );
	}

	describe( 'newsletter-signup', () => {
		it( 'should not be registered unless the `rrmExpressSetup` feature is enabled', () => {
			enabledFeatures.delete( 'rrmExpressSetup' );
			registry = createTestRegistryWithFeatures( [] ) as Registry;
			registerFeatures( createFeatureDiscovery( registry ) );

			expect(
				registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeature( 'newsletter-signup' )
			).toBeNull();
		} );

		it( 'should be undefined while the settings are unresolved', () => {
			provideRRM( true );
			freezeFetch(
				new RegExp(
					'^/google-site-kit/v1/modules/reader-revenue-manager/data/settings'
				)
			);

			expect( isNewsletterFeatureConnected() ).toBeUndefined();
		} );

		it( 'should not count as set up when RRM is connected without a newsletter sign-up form', () => {
			provideRRM( true );
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( { configuredCTAs: {} } );

			expect( isNewsletterFeatureConnected() ).toBe( false );
		} );

		it( 'should count as set up once a newsletter sign-up form is configured', () => {
			provideRRM( true );
			registry
				.dispatch( MODULES_READER_REVENUE_MANAGER )
				.receiveGetSettings( {
					configuredCTAs: {
						'cta-1': {
							type: 'newsletter-signup',
							state: 'ACTIVE',
							displayName: 'Weekly newsletter',
						},
					},
				} );

			expect( isNewsletterFeatureConnected() ).toBe( true );
		} );

		describe( 'setup state', () => {
			it.each( [ 'isEnabled', 'isInProgress' ] )(
				'should leave %s unresolved while activation loads',
				( callback ) => {
					freezeFetch(
						/^\/google-site-kit\/v1\/core\/modules\/data\/list/
					);

					const feature = registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeature( 'newsletter-signup' )!;

					expect(
						feature.setup[
							callback as 'isEnabled' | 'isInProgress'
						]!( registry.select )
					).toBeUndefined();
				}
			);

			it( 'should return false without loading module data when RRM is inactive', () => {
				provideRRM( false );

				expect( isNewsletterFeatureConnected() ).toBe( false );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.isFeatureInProgress( 'newsletter-signup' )
				).toBe( false );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should leave progress unresolved while user settings load', () => {
				provideRRM( true );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( { configuredCTAs: {} } );

				freezeFetch(
					/^\/google-site-kit\/v1\/modules\/reader-revenue-manager\/data\/user-settings/
				);

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.isFeatureInProgress( 'newsletter-signup' )
				).toBeUndefined();
			} );

			it.each( [
				[ {}, {}, false ],
				[ { 'survey:new': 123 }, {}, false ],
				[ { 'newsletter-signup:new': 123 }, {}, true ],
				[
					{ 'newsletter-signup:new': 123 },
					{
						cta: {
							type: 'newsletter-signup',
							state: 'ACTIVE',
							displayName: 'Weekly newsletter',
						},
					},
					false,
				],
			] )(
				'should derive progress from user entries %j and configured CTAs %j',
				( lastActionedExpressSetups, configuredCTAs, expected ) => {
					provideRRM( true );

					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.receiveGetSettings( { configuredCTAs } );

					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.receiveGetUserSettings( {
							lastActionedExpressSetups,
						} );

					expect(
						registry
							.select( CORE_FEATURE_DISCOVERY )
							.isFeatureInProgress( 'newsletter-signup' )
					).toBe( expected );
				}
			);
		} );

		describe( 'resume URL', () => {
			it( 'should open newsletter express setup without a hub return destination', () => {
				provideUserAuthentication( registry, {
					grantedScopes: EXPRESS_SETUP_SCOPES,
				} );

				const url = registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureResumeURL( 'newsletter-signup' );

				const setupURL = new URL( url! );

				expect( setupURL.origin + setupURL.pathname ).toBe(
					'http://example.com/wp-admin/admin.php'
				);

				expect( Object.fromEntries( setupURL.searchParams ) ).toEqual( {
					page: 'googlesitekit-dashboard',
					slug: 'reader-revenue-manager',
					reAuth: 'true',
					expressSetup: 'true',
					cta: 'newsletter-signup',
				} );
			} );

			it( 'should request the express setup scopes when permissions are missing', () => {
				provideUserAuthentication( registry );

				registry
					.dispatch( CORE_USER )
					.receiveConnectURL( 'https://example.com/connect' );

				const url = registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeatureResumeURL( 'newsletter-signup' );

				expect( url?.startsWith( 'https://example.com/connect' ) ).toBe(
					true
				);
				const params = new URL( url! ).searchParams;

				EXPRESS_SETUP_SCOPES.forEach( ( scope, index ) => {
					expect(
						params.get( `additional_scopes[${ index }]` )
					).toBe( scope.replace( /^https:/, 'gttps:' ) );
				} );

				const redirectURL = new URL( params.get( 'redirect' )! );

				expect( redirectURL.origin + redirectURL.pathname ).toBe(
					'http://example.com/wp-admin/admin.php'
				);

				expect(
					Object.fromEntries( redirectURL.searchParams )
				).toEqual( {
					page: 'googlesitekit-dashboard',
					slug: 'reader-revenue-manager',
					reAuth: 'true',
					expressSetup: 'true',
					cta: 'newsletter-signup',
				} );
			} );
		} );

		describe( 'reminder requirements', () => {
			it( 'should resolve activation and skip module requests when inactive', async () => {
				const modulesEndpoint =
					/^\/google-site-kit\/v1\/core\/modules\/data\/list/;

				fetchMock.getOnce( modulesEndpoint, {
					body: [
						{
							slug: MODULE_SLUG_READER_REVENUE_MANAGER,
							active: false,
							connected: false,
						},
					],
				} );

				await registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeature( 'newsletter-signup' )!
					.incompleteSetupReminder!.resolveRequirements( registry );

				expect(
					registry
						.select( CORE_MODULES )
						.isModuleActive( MODULE_SLUG_READER_REVENUE_MANAGER )
				).toBe( false );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should resolve user settings, module settings, and the resume URL', async () => {
				provideRRM( true );

				provideUserAuthentication( registry, {
					grantedScopes: EXPRESS_SETUP_SCOPES,
				} );

				registry
					.dispatch( CORE_USER )
					.receiveConnectURL( 'https://example.com/connect' );

				const userSettingsEndpoint =
					/^\/google-site-kit\/v1\/modules\/reader-revenue-manager\/data\/user-settings/;

				const settingsEndpoint =
					/^\/google-site-kit\/v1\/modules\/reader-revenue-manager\/data\/settings/;

				fetchMock.getOnce( userSettingsEndpoint, {
					body: {
						lastActionedExpressSetups: {
							'newsletter-signup:new': 123,
						},
					},
				} );

				fetchMock.getOnce( settingsEndpoint, {
					body: { configuredCTAs: {} },
				} );

				await registry
					.select( CORE_FEATURE_DISCOVERY )
					.getFeature( 'newsletter-signup' )!
					.incompleteSetupReminder!.resolveRequirements( registry );

				expect( fetchMock ).toHaveFetched( userSettingsEndpoint );
				expect( fetchMock ).toHaveFetched( settingsEndpoint );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.isFeatureInProgress( 'newsletter-signup' )
				).toBe( true );

				expect(
					registry
						.select( CORE_FEATURE_DISCOVERY )
						.getFeatureResumeURL( 'newsletter-signup' )
				).toContain( 'expressSetup=true' );
			} );
		} );
	} );
} );
