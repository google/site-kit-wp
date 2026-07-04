/**
 * `core/user` data store, setup flow tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
	WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
	WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
} from './constants';

describe( 'core/user setup flow', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'selectors', () => {
		describe( 'isDataGatheringCompleteModalActive', () => {
			it( 'should return true when the gathering data variant is dismissed but the tour variant is not', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
					] );

				expect(
					registry
						.select( CORE_USER )
						.isDataGatheringCompleteModalActive()
				).toBe( true );
			} );

			it( 'should return false when the gathering data variant is not dismissed', () => {
				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				expect(
					registry
						.select( CORE_USER )
						.isDataGatheringCompleteModalActive()
				).toBe( false );
			} );

			it( 'should return false when the tour variant is dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
					] );

				expect(
					registry
						.select( CORE_USER )
						.isDataGatheringCompleteModalActive()
				).toBe( false );
			} );

			it( 'should return false when both the gathering data and tour variants are dismissed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
						WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
					] );

				expect(
					registry
						.select( CORE_USER )
						.isDataGatheringCompleteModalActive()
				).toBe( false );
			} );
		} );

		describe( 'hasAccessToFeatureTour', () => {
			it( 'should return undefined when modules are not yet loaded', () => {
				freezeFetch(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' )
				);

				expect(
					registry.select( CORE_USER ).hasAccessToFeatureTour()
				).toBeUndefined();
			} );

			it( 'should return true for an authenticated user when both Analytics and Search Console are available', () => {
				provideUserAuthentication( registry );
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
					},
					{
						slug: MODULE_SLUG_SEARCH_CONSOLE,
						active: true,
						connected: true,
					},
				] );

				expect(
					registry.select( CORE_USER ).hasAccessToFeatureTour()
				).toBe( true );
			} );

			it( 'should return true for an authenticated user when only Search Console is available', () => {
				provideUserAuthentication( registry );
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: false,
						connected: false,
					},
					{
						slug: MODULE_SLUG_SEARCH_CONSOLE,
						active: true,
						connected: true,
					},
				] );

				expect(
					registry.select( CORE_USER ).hasAccessToFeatureTour()
				).toBe( true );
			} );

			it( 'should return false for a view-only user with no access to either Analytics or Search Console', () => {
				provideUserAuthentication( registry, { authenticated: false } );
				registry.dispatch( CORE_USER ).receiveGetCapabilities( {} );
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
						shareable: true,
					},
					{
						slug: MODULE_SLUG_SEARCH_CONSOLE,
						active: true,
						connected: true,
						shareable: true,
					},
				] );

				expect(
					registry.select( CORE_USER ).hasAccessToFeatureTour()
				).toBe( false );
			} );

			it( 'should return true for a view-only user with access to only the Search Console module', () => {
				provideUserAuthentication( registry, { authenticated: false } );
				registry.dispatch( CORE_USER ).receiveGetCapabilities( {
					[ getMetaCapabilityPropertyName(
						PERMISSION_READ_SHARED_MODULE_DATA,
						MODULE_SLUG_SEARCH_CONSOLE
					) ]: true,
				} );
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
						shareable: true,
					},
					{
						slug: MODULE_SLUG_SEARCH_CONSOLE,
						active: true,
						connected: true,
						shareable: true,
					},
				] );

				expect(
					registry.select( CORE_USER ).hasAccessToFeatureTour()
				).toBe( true );
			} );

			it( 'should return true for a view-only user with access to only the Analytics module', () => {
				provideUserAuthentication( registry, { authenticated: false } );
				registry.dispatch( CORE_USER ).receiveGetCapabilities( {
					[ getMetaCapabilityPropertyName(
						PERMISSION_READ_SHARED_MODULE_DATA,
						MODULE_SLUG_ANALYTICS_4
					) ]: true,
				} );
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: true,
						shareable: true,
					},
					{
						slug: MODULE_SLUG_SEARCH_CONSOLE,
						active: true,
						connected: true,
						shareable: true,
					},
				] );

				expect(
					registry.select( CORE_USER ).hasAccessToFeatureTour()
				).toBe( true );
			} );
		} );
	} );
} );
