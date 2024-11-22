/**
 * `modules/analytics-4` data store: conversion-reporting tests.
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
import { MODULES_ANALYTICS_4 } from './constants';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	untilResolved,
} from '../../../../../tests/js/utils';

describe( 'modules/analytics-4 conversion-reporting', () => {
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideModules( registry );

		store = registry.stores[ MODULES_ANALYTICS_4 ].store;
	} );

	afterEach( () => {
		global._googlesitekitModulesData = undefined;
	} );

	describe( 'actions', () => {
		describe( 'receiveConversionReportingInlineData', () => {
			it( 'requires the data param', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveConversionReportingInlineData();
				} ).toThrow( 'data is required.' );
			} );

			it( 'receives and sets inline data', async () => {
				const data = {
					newEvents: [ 'purchase' ],
					lostEvents: [],
				};

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveConversionReportingInlineData( data );
				expect( store.getState().detectedEventsChange ).toMatchObject(
					data
				);
			} );
		} );
		describe( 'dismissNewConversionReportingEvents', () => {
			it( 'fetches clear new events endpoint', async () => {
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/clear-conversion-reporting-new-events'
					),
					true
				);

				const { response } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.dismissNewConversionReportingEvents();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/clear-conversion-reporting-new-events'
					)
				);
				expect( response ).toEqual( true );
			} );
		} );

		describe( 'dismissLostConversionReportingEvents', () => {
			it( 'fetches clear lost events endpoint', async () => {
				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/clear-conversion-reporting-lost-events'
					),
					true
				);

				const { response } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.dismissLostConversionReportingEvents();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/clear-conversion-reporting-lost-events'
					)
				);
				expect( response ).toEqual( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'hasConversionReportingEvents', () => {
			it( 'returns false when no conversion reporting events are available', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setSettings( { detectedEvents: [] } );

				const hasConversionReportingEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.hasConversionReportingEvents( [ 'test-event' ] );

				expect( hasConversionReportingEvents ).toBe( false );
			} );

			it( 'returns true when provided conversion reporting event is available', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					detectedEvents: [ 'test-event', 'test-event-2' ],
				} );

				const hasConversionReportingEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.hasConversionReportingEvents( [ 'test-event' ] );

				expect( hasConversionReportingEvents ).toBe( true );
			} );

			it( 'returns true when some of provided conversion reporting events are available', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					detectedEvents: [
						'test-event',
						'test-event-2',
						'test-event-3',
					],
				} );

				const hasConversionReportingEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.hasConversionReportingEvents( [
						'no-event',
						'test-event',
					] );

				expect( hasConversionReportingEvents ).toBe( true );
			} );
		} );

		describe( 'getConversionReportingEventsChange', () => {
			it( 'uses a resolver to load conversion reporting inline data from a global variable by default', async () => {
				const inlineData = {
					newEvents: [ 'contact' ],
					lostEvents: [],
				};

				global._googlesitekitModulesData = {
					'analytics-4': inlineData,
				};

				registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionReportingEventsChange();
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getConversionReportingEventsChange();

				const data = registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionReportingEventsChange();

				expect( data ).toEqual( inlineData );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global._googlesitekitModulesData ).toEqual( undefined );

				const data = registry
					.select( MODULES_ANALYTICS_4 )
					.getConversionReportingEventsChange();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getConversionReportingEventsChange();

				expect( data ).toBe( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe.each( [
			[
				'hasNewConversionReportingEvents',
				'newEvents',
				[ 'submit_lead_form' ],
				true,
			],
			[ 'hasNewConversionReportingEvents', 'newEvents', [], false ],
			[
				'hasNewConversionReportingEvents',
				'newEvents',
				undefined,
				undefined,
			],
			[
				'hasLostConversionReportingEvents',
				'lostEvents',
				[ 'contact' ],
				true,
			],
			[ 'hasLostConversionReportingEvents', 'lostEvents', [], false ],
			[
				'hasLostConversionReportingEvents',
				'lostEvents',
				undefined,
				undefined,
			],
		] )( '%s', ( selector, dataKey, events, expectedReturn ) => {
			it( 'uses a resolver to load conversion reporting data then returns the data when this specific selector is used', () => {
				const inlineData = {
					[ dataKey ]: events,
				};

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveConversionReportingInlineData( inlineData );

				const data = registry
					.select( MODULES_ANALYTICS_4 )
					[ selector ]();

				expect( data ).toEqual( expectedReturn );
			} );
		} );
	} );
} );
