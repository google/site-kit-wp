/**
 * `core/site` data store, settings tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { CORE_SITE } from './constants';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
} from '../../../../../tests/js/utils';

describe( 'core/site urls', () => {
	let registry;

	const adminBarSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/admin-bar-settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {} );

	describe( 'actions', () => {
		describe( 'setShowAdminBar', () => {
			beforeEach( () => {
				registry.dispatch( CORE_SITE ).receiveGetAdminBarSettings( {} );
			} );

			it.each( [
				[ 'true', true ],
				[ 'false', false ],
			] )( 'should set "enabled" setting to %s', async ( _, enabled ) => {
				fetchMock.postOnce( adminBarSettingsEndpoint, {
					body: { enabled },
				} );

				await registry.dispatch( CORE_SITE ).setShowAdminBar( enabled );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched( adminBarSettingsEndpoint, {
					body: {
						data: { enabled },
					},
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAdminBarSettings', () => {
			it( 'should use a resolver to make a network request', async () => {
				const enabled = true;

				fetchMock.getOnce( adminBarSettingsEndpoint, {
					body: { enabled },
				} );

				expect(
					registry.select( CORE_SITE ).getAdminBarSettings()
				).toBeUndefined();
				await untilResolved(
					registry,
					CORE_SITE
				).getAdminBarSettings();

				expect(
					registry.select( CORE_SITE ).getAdminBarSettings()
				).toEqual( { enabled } );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if data is already in state', async () => {
				const enabled = false;

				registry
					.dispatch( CORE_SITE )
					.receiveGetAdminBarSettings( { enabled } );

				registry.select( CORE_SITE ).getAdminBarSettings();
				await untilResolved(
					registry,
					CORE_SITE
				).getAdminBarSettings();

				expect(
					registry.select( CORE_SITE ).getAdminBarSettings()
				).toEqual( { enabled } );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( adminBarSettingsEndpoint, {
					body: response,
					status: 500,
				} );

				registry.select( CORE_SITE ).getAdminBarSettings();
				await untilResolved(
					registry,
					CORE_SITE
				).getAdminBarSettings();

				expect(
					registry.select( CORE_SITE ).getAdminBarSettings()
				).toBeUndefined();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getShowAdminBar', () => {
			it( 'should return undefined when admin bar settings are being resolved still', async () => {
				muteFetch( adminBarSettingsEndpoint );
				expect(
					registry.select( CORE_SITE ).getShowAdminBar()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getAdminBarSettings();
			} );

			it.each( [
				[ 'false', false ],
				[ 'true', true ],
			] )( 'should return %s from admin bar settings', ( _, enabled ) => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetAdminBarSettings( { enabled } );
				expect( registry.select( CORE_SITE ).getShowAdminBar() ).toBe(
					enabled
				);
			} );
		} );
	} );
} );
