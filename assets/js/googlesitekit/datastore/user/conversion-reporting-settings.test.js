/**
 * `modules/analytics-4` data store: audience settings tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import API from 'googlesitekit-api';
import { CORE_USER } from './constants';
import {
	createTestRegistry,
	freezeFetch,
	muteFetch,
	provideModules,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';

describe( 'core/user conversion reporting settings', () => {
	let registry;
	let store;

	const conversionReportingSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/conversion-reporting-settings'
	);

	let conversionReportingSettingsResponse;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideModules( registry );
		store = registry.stores[ CORE_USER ].store;

		conversionReportingSettingsResponse = {
			newEventsCalloutDismissedAt: 0,
			lostEventsCalloutDismissedAt: 0,
		};
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'saveConversionReportingSettings', () => {
			it( 'should save settings and add it to the store', async () => {
				const newEventsCalloutDismissedAt = 1734470013;

				fetchMock.postOnce( conversionReportingSettingsEndpoint, {
					body: {
						...conversionReportingSettingsResponse,
						newEventsCalloutDismissedAt,
					},
				} );

				await registry
					.dispatch( CORE_USER )
					.saveConversionReportingSettings( {
						newEventsCalloutDismissedAt,
					} );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					conversionReportingSettingsEndpoint,
					{
						body: {
							data: {
								settings: { newEventsCalloutDismissedAt },
							},
						},
					}
				);

				const conversionReportingSettings =
					store.getState().conversionReportingSettings;

				expect( conversionReportingSettings ).toEqual( {
					...conversionReportingSettingsResponse,
					newEventsCalloutDismissedAt,
				} );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( conversionReportingSettingsEndpoint, {
					body: response,
					status: 500,
				} );

				const settingsPartial = {
					newEventsCalloutDismissedAt: 1734466109,
				};

				await registry
					.dispatch( CORE_USER )
					.saveConversionReportingSettings( settingsPartial );

				expect(
					registry
						.select( CORE_USER )
						.getErrorForAction( 'saveConversionReportingSettings', [
							settingsPartial,
						] )
				).toMatchObject( response );

				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getConversionReportingSettings', () => {
			it( 'should return undefined while conversion reporting settings are loading', async () => {
				freezeFetch( conversionReportingSettingsEndpoint );

				expect(
					registry
						.select( CORE_USER )
						.getConversionReportingSettings()
				).toBeUndefined();

				await waitForDefaultTimeouts();
			} );

			it( 'should not make a network request if conversion reporting settings exist', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetConversionReportingSettings(
						conversionReportingSettingsResponse
					);

				registry.select( CORE_USER ).getConversionReportingSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getConversionReportingSettings();

				expect( fetchMock ).not.toHaveFetched(
					conversionReportingSettingsEndpoint
				);
			} );

			it( 'should use a resolver to make a network request if data is not available', async () => {
				fetchMock.getOnce( conversionReportingSettingsEndpoint, {
					body: conversionReportingSettingsResponse,
					status: 200,
				} );

				registry.select( CORE_USER ).getConversionReportingSettings();

				await untilResolved(
					registry,
					CORE_USER
				).getConversionReportingSettings();

				expect( fetchMock ).toHaveFetched(
					conversionReportingSettingsEndpoint,
					{
						body: {
							settings: conversionReportingSettingsResponse,
						},
					}
				);

				expect(
					registry
						.select( CORE_USER )
						.getConversionReportingSettings()
				).toMatchObject( conversionReportingSettingsResponse );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );

		describe( 'isSavingConversionReportingSettings', () => {
			it( 'should return false if conversion reporting settings are not being saved', () => {
				expect(
					registry
						.select( CORE_USER )
						.isSavingConversionReportingSettings()
				).toBe( false );
			} );

			it( 'should return true if conversion reporting settings are being saved', async () => {
				muteFetch( conversionReportingSettingsEndpoint );

				const promise = registry
					.dispatch( CORE_USER )
					.fetchSaveConversionReportingSettings(
						conversionReportingSettingsResponse
					);

				expect(
					registry
						.select( CORE_USER )
						.isSavingConversionReportingSettings()
				).toBe( true );

				await promise;

				expect(
					registry
						.select( CORE_USER )
						.isSavingConversionReportingSettings()
				).toBe( false );
			} );
		} );

		describe.each( [
			[ 'haveNewConversionEventsAfterDismiss' ],
			[ 'haveLostConversionEventsAfterDismiss' ],
		] )( '%s', ( selector ) => {
			it.each( [
				[
					true,
					'after the callout was dismissed',
					1734512930,
					1734253730,
				],
				[ true, 'and the callout was never dismissed', 1734512930, 0 ],
				[
					false,
					'before the callout was dismissed',
					1734253730,
					1734512930,
				],
			] )(
				'should return %s when most recent new events sync happened %s',
				( expected, _, eventsLastSyncedAt, calloutDismissedAt ) => {
					registry
						.dispatch( CORE_USER )
						.receiveGetConversionReportingSettings( {
							newEventsCalloutDismissedAt: calloutDismissedAt,
							lostEventsCalloutDismissedAt: calloutDismissedAt,
						} );

					const result = registry
						.select( CORE_USER )
						[ selector ]( eventsLastSyncedAt );

					expect( result ).toBe( expected );
				}
			);
		} );
	} );
} );
