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
import { createTestRegistry, untilResolved } from '@tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 site goals settings', () => {
	let registry: WPDataRegistry;

	const getSiteGoalsSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/site-goals-settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'selectors', () => {
		describe( 'getSiteGoalsSettings', () => {
			it( 'should fetch the settings from the endpoint when not yet loaded', async () => {
				fetchMock.getOnce( getSiteGoalsSettingsEndpoint, {
					body: { activeWidgets: [ 'ecommerce', 'lead' ] },
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
				).toEqual( { activeWidgets: [ 'ecommerce', 'lead' ] } );
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

		describe( 'getActiveWidgets', () => {
			it( 'should return undefined before settings are loaded', () => {
				expect(
					registry.select( MODULES_ANALYTICS_4 ).getActiveWidgets()
				).toBeUndefined();
			} );

			it( 'should return the activeWidgets array after settings are loaded', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [ 'ecommerce', 'lead' ],
					} );

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getActiveWidgets()
				).toEqual( [ 'ecommerce', 'lead' ] );
			} );

			it( 'should return an empty array when no widgets are active', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSiteGoalsSettings( {
						activeWidgets: [],
					} );

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getActiveWidgets()
				).toEqual( [] );
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
