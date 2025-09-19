/**
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
import { setUsingCache } from 'googlesitekit-api';
import {
	createTestRegistry,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site Proactive User Engagement', () => {
	let registry;

	const pueSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/site/data/proactive-user-engagement'
	);

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveProactiveUserEngagementSettings', () => {
			it( 'saves the settings and returns the response', async () => {
				const updatedSettings = {
					enabled: true,
				};

				fetchMock.postOnce( pueSettingsEndpointRegExp, {
					body: updatedSettings,
					status: 200,
				} );

				registry
					.dispatch( CORE_SITE )
					.receiveGetProactiveUserEngagementSettings( {
						enabled: false,
					} );

				registry
					.dispatch( CORE_SITE )
					.setProactiveUserEngagementEnabled( true );

				const { response } = await registry
					.dispatch( CORE_SITE )
					.saveProactiveUserEngagementSettings();

				expect( fetchMock ).toHaveFetched( pueSettingsEndpointRegExp, {
					body: {
						data: {
							settings: updatedSettings,
						},
					},
				} );

				expect( response ).toEqual( updatedSettings );
			} );

			it( 'returns an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce( pueSettingsEndpointRegExp, {
					body: errorResponse,
					status: 500,
				} );

				registry
					.dispatch( CORE_SITE )
					.setProactiveUserEngagementEnabled( true );

				const { error } = await registry
					.dispatch( CORE_SITE )
					.saveProactiveUserEngagementSettings();

				expect( fetchMock ).toHaveFetched( pueSettingsEndpointRegExp, {
					body: {
						data: {
							settings: { enabled: true },
						},
					},
				} );

				expect( error ).toEqual( errorResponse );

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'setProactiveUserEngagementEnabled', () => {
			it( 'sets the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetProactiveUserEngagementSettings( {
						enabled: false,
					} );

				expect(
					registry
						.select( CORE_SITE )
						.isProactiveUserEngagementEnabled()
				).toBe( false );

				registry
					.dispatch( CORE_SITE )
					.setProactiveUserEngagementEnabled( true );

				expect(
					registry
						.select( CORE_SITE )
						.isProactiveUserEngagementEnabled()
				).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getProactiveUserEngagementSettings', () => {
			it( 'uses a resolver to make a network request', async () => {
				const settingsResponse = {
					enabled: false,
				};

				fetchMock.getOnce( pueSettingsEndpointRegExp, {
					body: settingsResponse,
					status: 200,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getProactiveUserEngagementSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getProactiveUserEngagementSettings();

				const settings = registry
					.select( CORE_SITE )
					.getProactiveUserEngagementSettings();

				expect( settings ).toEqual( settingsResponse );

				expect( fetchMock ).toHaveFetched( pueSettingsEndpointRegExp );
			} );

			it( 'returns undefined if the request fails', async () => {
				fetchMock.getOnce( pueSettingsEndpointRegExp, {
					body: { error: 'something went wrong' },
					status: 500,
				} );

				const initialSettings = registry
					.select( CORE_SITE )
					.getProactiveUserEngagementSettings();

				expect( initialSettings ).toBeUndefined();

				await untilResolved(
					registry,
					CORE_SITE
				).getProactiveUserEngagementSettings();

				const settings = registry
					.select( CORE_SITE )
					.getProactiveUserEngagementSettings();

				// Verify the settings are still undefined after the selector is resolved.
				expect( settings ).toBeUndefined();

				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched( pueSettingsEndpointRegExp );

				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isProactiveUserEngagementEnabled', () => {
			it( 'returns the enabled status', () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetProactiveUserEngagementSettings( {
						enabled: true,
					} );

				expect(
					registry
						.select( CORE_SITE )
						.isProactiveUserEngagementEnabled()
				).toBe( true );
			} );
		} );
	} );
} );
