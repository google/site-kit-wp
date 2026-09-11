/**
 * `modules/analytics-4` data store: site goals settings tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { waitFor } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	subscribeUntil,
	untilResolved,
} from '@tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 site goals settings', () => {
	let registry: WPDataRegistry;

	const getSiteGoalsSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/site-goals-settings'
	);
	const saveSiteGoalsSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/save-site-goals-settings'
	);
	const removeSiteGoalsWidgetEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/remove-site-goals-widget'
	);
	const settingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);

	const goalDrivers = {
		ecommerce: [ 'topTrafficChannels' ],
		lead: [ 'visitorType' ],
	};
	const visitorEngagement = {
		ecommerce: [ 'add_to_cart' ],
		lead: [],
	};

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
	} );

	describe( 'actions', () => {
		describe( 'saveSiteGoalsSettings', () => {
			it( 'should post the merged settings and update the store on success', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						goalDrivers,
						activeWidgets: [ 'ecommerce' ],
					} );

				fetchMock.postOnce(
					saveSiteGoalsSettingsEndpoint,
					( _url, opts ) => ( {
						body: JSON.parse( opts.body as string ).data.settings,
						status: 200,
					} )
				);

				const { response, error } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.saveSiteGoalsSettings( { visitorEngagement } );

				expect( error ).toBeUndefined();
				// The partial save preserves the existing goalDrivers.
				expect( response ).toEqual( {
					goalDrivers,
					visitorEngagement,
				} );
				expect( fetchMock ).toHaveFetched(
					saveSiteGoalsSettingsEndpoint,
					{
						body: {
							data: {
								settings: { goalDrivers, visitorEngagement },
							},
						},
					}
				);

				// activeWidgets from site-wide settings is preserved in state.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsSettings()
				).toEqual( {
					goalDrivers,
					visitorEngagement,
					activeWidgets: [ 'ecommerce' ],
				} );
			} );

			it( 'should return an error when the request fails', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {} );

				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce( saveSiteGoalsSettingsEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.saveSiteGoalsSettings( { goalDrivers } );

				expect( console ).toHaveErrored();
				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
			} );

			it( 'should validate the settings shape', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.saveSiteGoalsSettings( { goalDrivers: 'invalid' } )
				).toThrow( /goalDrivers should be an object/ );
			} );
		} );

		describe( 'removeSiteGoalsWidget', () => {
			it( 'should post the widget to the removal endpoint and remove it from the active widgets', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						goalDrivers,
						activeWidgets: [ 'ecommerce', 'lead' ],
					} );

				fetchMock.postOnce( removeSiteGoalsWidgetEndpoint, {
					body: { activeWidgets: [ 'ecommerce' ] },
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.removeSiteGoalsWidget( 'lead' );

				expect( error ).toBeUndefined();
				expect( response ).toEqual( {
					activeWidgets: [ 'ecommerce' ],
				} );
				expect( fetchMock ).toHaveFetched(
					removeSiteGoalsWidgetEndpoint,
					{ body: { data: { widget: 'lead' } } }
				);
			} );

			it( 'should update only the active widgets and keep the goal drivers and visitor engagement settings when a widget is removed', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						goalDrivers,
						visitorEngagement,
						activeWidgets: [ 'ecommerce', 'lead' ],
					} );

				fetchMock.postOnce( removeSiteGoalsWidgetEndpoint, {
					body: { activeWidgets: [ 'lead' ] },
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.removeSiteGoalsWidget( 'ecommerce' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsSettings()
				).toEqual( {
					goalDrivers,
					visitorEngagement,
					activeWidgets: [ 'lead' ],
				} );
			} );

			it( 'should leave the other widget active and the removed widget inactive', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce', 'lead' ],
					} );

				fetchMock.postOnce( removeSiteGoalsWidgetEndpoint, {
					body: { activeWidgets: [ 'lead' ] },
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.removeSiteGoalsWidget( 'ecommerce' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetActive( 'ecommerce' )
				).toBe( false );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetActive( 'lead' )
				).toBe( true );
			} );

			it( 'should stop the removed widget from rendering', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce', 'lead' ],
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ 'purchase', 'contact' ] );

				fetchMock.postOnce( removeSiteGoalsWidgetEndpoint, {
					body: { activeWidgets: [ 'lead' ] },
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.removeSiteGoalsWidget( 'ecommerce' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'ecommerce' )
				).toBe( false );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'lead' )
				).toBe( true );
			} );

			it( 'should return an error when the request fails', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce', 'lead' ],
					} );

				const errorResponse = {
					code: 'site_goals_widget_provider_active',
					message:
						'This Site Goals widget can’t be removed while a plugin that tracks its events is active.',
					data: { status: 400 },
				};

				fetchMock.postOnce( removeSiteGoalsWidgetEndpoint, {
					body: errorResponse,
					status: 400,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.removeSiteGoalsWidget( 'ecommerce' );

				expect( console ).toHaveErrored();
				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsSettings().activeWidgets
				).toEqual( [ 'ecommerce', 'lead' ] );
			} );

			it( 'should throw for a widget outside the Site Goals goal types', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.removeSiteGoalsWidget( 'traffic' )
				).toThrow( /widget should be one of lead, ecommerce/ );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getSiteGoalsSettings', () => {
			it( 'should not fetch the settings when Analytics is not connected', async () => {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: false,
						connected: false,
					},
				] );

				registry.select( MODULES_ANALYTICS_4 ).getSiteGoalsSettings();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSiteGoalsSettings();

				expect( fetchMock ).not.toHaveFetched(
					getSiteGoalsSettingsEndpoint
				);
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsSettings()
				).toBeUndefined();
			} );

			it( 'should fetch the settings from the endpoint when not yet loaded', async () => {
				fetchMock.getOnce( getSiteGoalsSettingsEndpoint, {
					body: {
						goalDrivers,
						visitorEngagement,
						activeWidgets: [ 'ecommerce' ],
					},
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsSettings()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSiteGoalsSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsSettings()
				).toEqual( {
					goalDrivers,
					visitorEngagement,
					activeWidgets: [ 'ecommerce' ],
				} );
			} );

			it( 'should not fetch when settings are already loaded via receiveGetSiteGoalsSettings', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce' ],
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsSettings()
				).toEqual( { activeWidgets: [ 'ecommerce' ] } );

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSiteGoalsSettings();

				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );
		} );

		describe( 'getSiteGoalsGoalDrivers / getSiteGoalsVisitorEngagement', () => {
			it( 'should return the populated selections after receiving settings', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						goalDrivers,
						visitorEngagement,
						activeWidgets: [ 'ecommerce' ],
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsGoalDrivers()
				).toEqual( goalDrivers );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsVisitorEngagement()
				).toEqual( visitorEngagement );
			} );

			it( 'should return undefined for missing keys', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsGoalDrivers()
				).toBeUndefined();
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsVisitorEngagement()
				).toBeUndefined();
			} );

			it( 'should trigger fetch via the derived getSiteGoalsGoalDrivers selector', async () => {
				fetchMock.getOnce( getSiteGoalsSettingsEndpoint, {
					body: { goalDrivers, visitorEngagement },
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsGoalDrivers()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSiteGoalsSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getSiteGoalsGoalDrivers()
				).toEqual( goalDrivers );
			} );
		} );

		describe( 'isSiteGoalsWidgetActive', () => {
			it( 'should return undefined before settings are loaded', async () => {
				fetchMock.getOnce( getSiteGoalsSettingsEndpoint, {
					body: { activeWidgets: [] },
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetActive( 'ecommerce' )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSiteGoalsSettings();
			} );

			it( 'should return true for a category that is in activeWidgets', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce', 'lead' ],
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetActive( 'ecommerce' )
				).toBe( true );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetActive( 'lead' )
				).toBe( true );
			} );

			it( 'should return false for a category that is not in activeWidgets', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce' ],
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetActive( 'lead' )
				).toBe( false );
			} );

			it( 'should return false for all categories when activeWidgets is empty', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [],
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetActive( 'ecommerce' )
				).toBe( false );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetActive( 'lead' )
				).toBe( false );
			} );
		} );

		describe( 'isSiteGoalsWidgetRenderable', () => {
			function receiveSettings(
				activeWidgets: string[],
				detectedEvents: string[]
			) {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( { activeWidgets } );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( { detectedEvents } );
			}

			it( 'should return true when the category is active and its events are detected', () => {
				receiveSettings(
					[ 'ecommerce', 'lead' ],
					[ 'purchase', 'contact' ]
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'ecommerce' )
				).toBe( true );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'lead' )
				).toBe( true );
			} );

			it( 'should return true for either event of a category', () => {
				receiveSettings(
					[ 'ecommerce', 'lead' ],
					[ 'add_to_cart', 'submit_lead_form' ]
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'ecommerce' )
				).toBe( true );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'lead' )
				).toBe( true );
			} );

			it( 'should return false when the category is active but its events are not detected', () => {
				receiveSettings( [ 'ecommerce', 'lead' ], [ 'purchase' ] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'lead' )
				).toBe( false );
			} );

			it( 'should return false when the events are detected but the category is not active', () => {
				receiveSettings( [ 'lead' ], [ 'purchase', 'contact' ] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'ecommerce' )
				).toBe( false );
			} );

			it( 'should return false when no events are detected at all', () => {
				receiveSettings( [ 'ecommerce', 'lead' ], [] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'ecommerce' )
				).toBe( false );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'lead' )
				).toBe( false );
			} );

			it( 'should return false for an unknown category', () => {
				receiveSettings( [ 'ecommerce' ], [ 'purchase' ] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'unknown' )
				).toBe( false );
			} );

			it( 'should return undefined while the site goals settings are unresolved', async () => {
				fetchMock.getOnce( getSiteGoalsSettingsEndpoint, {
					body: { activeWidgets: [ 'ecommerce' ] },
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( { detectedEvents: [ 'purchase' ] } );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'ecommerce' )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSiteGoalsSettings();
			} );

			it( 'should return undefined while the detected events are unresolved', async () => {
				fetchMock.getOnce( settingsEndpoint, {
					body: { detectedEvents: [ 'purchase' ] },
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce' ],
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsWidgetRenderable( 'ecommerce' )
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSettings();
			} );
		} );

		describe( 'isSavingSiteGoalsSettings', () => {
			it( 'should return true while a save is in flight', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {} );

				let resolveRequest!: () => void;
				fetchMock.postOnce(
					saveSiteGoalsSettingsEndpoint,
					() =>
						new Promise( ( resolve ) => {
							resolveRequest = () =>
								resolve( {
									body: { goalDrivers },
									status: 200,
								} );
						} )
				);

				const promise = registry
					.dispatch( MODULES_ANALYTICS_4 )
					.saveSiteGoalsSettings( { goalDrivers } );

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSavingSiteGoalsSettings()
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSavingSiteGoalsSettings()
				).toBe( true );

				resolveRequest();
				await promise;

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSavingSiteGoalsSettings()
				).toBe( false );
			} );
		} );

		describe( 'isRemovingSiteGoalsWidget', () => {
			it( 'should return true while the removal request runs and false after it finishes', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce', 'lead' ],
					} );

				let resolveRequest!: () => void;
				fetchMock.postOnce(
					removeSiteGoalsWidgetEndpoint,
					() =>
						new Promise( ( resolve ) => {
							resolveRequest = () =>
								resolve( {
									body: { activeWidgets: [ 'lead' ] },
									status: 200,
								} );
						} )
				);

				const promise = registry
					.dispatch( MODULES_ANALYTICS_4 )
					.removeSiteGoalsWidget( 'ecommerce' );

				await waitFor( () =>
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.isRemovingSiteGoalsWidget()
					).toBe( true )
				);

				resolveRequest();
				await promise;

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isRemovingSiteGoalsWidget()
				).toBe( false );
			} );
		} );

		describe( 'isSiteGoalsBreakdownTooltipPending', () => {
			it( 'defaults to false and toggles with the set/clear actions', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsBreakdownTooltipPending()
				).toBe( false );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setSiteGoalsBreakdownTooltipPending();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsBreakdownTooltipPending()
				).toBe( true );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.clearSiteGoalsBreakdownTooltipPending();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalsBreakdownTooltipPending()
				).toBe( false );
			} );
		} );
	} );
} );
