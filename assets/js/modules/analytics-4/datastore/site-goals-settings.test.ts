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
import {
	createTestRegistry,
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
	} );

	describe( 'selectors', () => {
		describe( 'getSiteGoalsSettings', () => {
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

		describe( 'isSiteGoalWidgetActive', () => {
			it( 'should return undefined before settings are loaded', async () => {
				fetchMock.getOnce( getSiteGoalsSettingsEndpoint, {
					body: { activeWidgets: [] },
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetActive( 'ecommerce' )
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
						.isSiteGoalWidgetActive( 'ecommerce' )
				).toBe( true );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetActive( 'lead' )
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
						.isSiteGoalWidgetActive( 'lead' )
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
						.isSiteGoalWidgetActive( 'ecommerce' )
				).toBe( false );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetActive( 'lead' )
				).toBe( false );
			} );
		} );

		describe( 'isSiteGoalWidgetRenderable', () => {
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
						.isSiteGoalWidgetRenderable( 'ecommerce' )
				).toBe( true );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetRenderable( 'lead' )
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
						.isSiteGoalWidgetRenderable( 'ecommerce' )
				).toBe( true );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetRenderable( 'lead' )
				).toBe( true );
			} );

			it( 'should return false when the category is active but its events are not detected', () => {
				receiveSettings( [ 'ecommerce', 'lead' ], [ 'purchase' ] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetRenderable( 'lead' )
				).toBe( false );
			} );

			it( 'should return false when the events are detected but the category is not active', () => {
				receiveSettings( [ 'lead' ], [ 'purchase', 'contact' ] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetRenderable( 'ecommerce' )
				).toBe( false );
			} );

			it( 'should return false when no events are detected at all', () => {
				receiveSettings( [ 'ecommerce', 'lead' ], [] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetRenderable( 'ecommerce' )
				).toBe( false );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetRenderable( 'lead' )
				).toBe( false );
			} );

			it( 'should return false for an unknown category', () => {
				receiveSettings( [ 'ecommerce' ], [ 'purchase' ] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isSiteGoalWidgetRenderable( 'unknown' )
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
						.isSiteGoalWidgetRenderable( 'ecommerce' )
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
						.isSiteGoalWidgetRenderable( 'ecommerce' )
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
