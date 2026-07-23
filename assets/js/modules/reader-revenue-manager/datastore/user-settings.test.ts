/**
 * `modules/reader-revenue-manager` data store: user settings tests.
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
import { MODULES_READER_REVENUE_MANAGER } from './constants';

describe( 'modules/reader-revenue-manager user settings', () => {
	let registry: WPDataRegistry;

	const userSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/reader-revenue-manager/data/user-settings'
	);

	const settings = {
		lastActionedExpressSetups: {
			publicationSetup: 1752451200,
		},
	};

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'saveUserSettings', () => {
			it( 'should save the settings and update the store', async () => {
				const previousError = {
					code: 'previous_error',
					message: 'Previous error',
					data: { status: 500 },
				};
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.setErrorForAction( previousError, 'saveUserSettings', [] );

				fetchMock.postOnce( userSettingsEndpoint, {
					body: settings,
					status: 200,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.saveUserSettings( settings );

				expect( response ).toEqual( settings );
				expect( error ).toBeUndefined();
				expect( fetchMock ).toHaveFetched( userSettingsEndpoint, {
					body: {
						data: settings,
					},
				} );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getUserSettings()
				).toEqual( settings );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForAction( 'saveUserSettings', [] )
				).toBeUndefined();
			} );

			it( 'should set an action error when the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.postOnce( userSettingsEndpoint, {
					body: errorResponse,
					status: 500,
				} );

				const { response, error } = await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.saveUserSettings( settings );

				expect( console ).toHaveErrored();
				expect( response ).toBeUndefined();
				expect( error ).toEqual( errorResponse );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getErrorForAction( 'saveUserSettings', [] )
				).toEqual( errorResponse );
			} );

			it( 'should validate the settings', () => {
				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.saveUserSettings( null )
				).toThrow( 'settings should be an object.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.saveUserSettings( {
							lastActionedExpressSetups: [],
						} )
				).toThrow( 'lastActionedExpressSetups should be an object.' );

				expect( () =>
					registry
						.dispatch( MODULES_READER_REVENUE_MANAGER )
						.saveUserSettings( {
							lastActionedExpressSetups: {
								publicationSetup: '1752451200',
							},
						} )
				).toThrow(
					'lastActionedExpressSetups timestamps should be integers.'
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getUserSettings', () => {
			it( 'should fetch the settings when they are not loaded', async () => {
				fetchMock.getOnce( userSettingsEndpoint, {
					body: settings,
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getUserSettings()
				).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getUserSettings();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getUserSettings()
				).toEqual( settings );
			} );

			it( 'should not fetch settings that are already loaded', async () => {
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetUserSettings( settings );

				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getUserSettings()
				).toEqual( settings );

				await untilResolved(
					registry,
					MODULES_READER_REVENUE_MANAGER
				).getUserSettings();

				expect( fetchMock ).toHaveFetchedTimes( 0 );
				expect(
					registry
						.select( MODULES_READER_REVENUE_MANAGER )
						.getUserSettings()
				).toEqual( settings );
			} );
		} );
	} );
} );
