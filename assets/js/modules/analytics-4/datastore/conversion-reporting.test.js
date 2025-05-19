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
import {
	createTestRegistry,
	provideKeyMetrics,
	provideKeyMetricsUserInputSettings,
	provideModules,
	provideUserAuthentication,
	untilResolved,
} from '../../../../../tests/js/utils';
import {
	CORE_USER,
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART,
	KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
} from '../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4, ENUM_CONVERSION_EVENTS } from './constants';

describe( 'modules/analytics-4 conversion-reporting', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideModules( registry );
	} );

	afterEach( () => {
		global._googlesitekitModulesData = undefined;
	} );

	describe( 'selectors', () => {
		describe( 'getConversionReportingEventsChange', () => {
			it( 'uses a resolver to load conversion reporting inline data from a global variable by default', async () => {
				const inlineData = {
					newEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
					lostEvents: [],
					newBadgeEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
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
				).getModuleData();

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
				).getModuleData();

				expect( data ).toBe( undefined );
			} );
		} );

		describe.each( [
			[
				'hasNewConversionReportingEvents',
				'newEvents',
				[ ENUM_CONVERSION_EVENTS.SUBMIT_LEAD_FORM ],
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
				[ ENUM_CONVERSION_EVENTS.CONTACT ],
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
			it( 'uses a resolver to load data then returns the value when this specific selector is used', async () => {
				const inlineData = {
					[ dataKey ]: events,
				};

				global._googlesitekitModulesData = {
					'analytics-4': inlineData,
				};

				registry.select( MODULES_ANALYTICS_4 )[ selector ]();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getModuleData();

				const moduleData = registry
					.select( MODULES_ANALYTICS_4 )
					.getModuleData();

				const selectorValue = registry
					.select( MODULES_ANALYTICS_4 )
					[ selector ]();

				expect( moduleData ).toHaveProperty( dataKey );
				expect( selectorValue ).toEqual( expectedReturn );
			} );

			it( 'will return initial state (undefined) when module data is not available', async () => {
				const result = registry
					.select( MODULES_ANALYTICS_4 )
					[ selector ]();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getModuleData();

				expect( result ).toEqual( undefined );
			} );
		} );

		describe( 'haveConversionEventsForTailoredMetrics', () => {
			beforeEach( () => {
				provideKeyMetricsUserInputSettings( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [] );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [],
					isWidgetHidden: false,
				} );
			} );

			it( 'should return true when detectedEvents have an event associated with ACR KWM for the current purpose', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

				const haveConversionEventsForTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveConversionEventsForTailoredMetrics();

				// Default purpose answer provided by provideKeyMetricsUserInputSettings is "publish_blog", which
				// has metrics related to the "contact" event, so selector should return true.
				expect( haveConversionEventsForTailoredMetrics ).toEqual(
					true
				);
			} );

			it( 'should return true when new detected events have an event associated with ACR KWM for the passed purpose when useNewEvents is passed', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				const haveConversionEventsForTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveConversionEventsForTailoredMetrics(
						'publish_blog',
						true
					);

				expect( haveConversionEventsForTailoredMetrics ).toEqual(
					true
				);
			} );

			it( 'should return false when detectedEvents do not have an event associated with ACR KWM for the current purpose', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

				const haveConversionEventsForTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveConversionEventsForTailoredMetrics();

				expect( haveConversionEventsForTailoredMetrics ).toEqual(
					false
				);
			} );

			it( 'should return false when new detected events do not have an event associated with ACR KWM for the passed purpose when useNewEvents is passed', () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.ADD_TO_CART ],
					lostEvents: [],
					newBadgeEvents: [],
				} );

				const haveConversionEventsForTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveConversionEventsForTailoredMetrics(
						'publish_blog',
						true
					);

				expect( haveConversionEventsForTailoredMetrics ).toEqual(
					false
				);
			} );
		} );

		describe( 'getUserInputPurposeConversionEvents', () => {
			it( 'should return detected conversion events associated with the current site purpose', () => {
				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: { values: [ 'publish_blog' ] },
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

				const userInputPurposeConversionEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getUserInputPurposeConversionEvents();

				expect( userInputPurposeConversionEvents ).toEqual( [
					ENUM_CONVERSION_EVENTS.CONTACT,
				] );
			} );

			it( 'should return empty array if there are no conversion events associated with the current site purpose', () => {
				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: { values: [ 'sell_products' ] },
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

				const userInputPurposeConversionEvents = registry
					.select( MODULES_ANALYTICS_4 )
					.getUserInputPurposeConversionEvents();

				expect( userInputPurposeConversionEvents ).toEqual( [] );
			} );
		} );

		describe( 'shouldIncludeConversionTailoredMetrics', () => {
			beforeEach( () => {
				provideKeyMetricsUserInputSettings( registry );

				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'analytics-4',
					},
				] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [] );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [],
					isWidgetHidden: false,
				} );
			} );

			it( 'should return empty array if Analytics module is not connected', () => {
				provideModules( registry, [
					{
						active: true,
						connected: false,
						slug: 'analytics-4',
					},
				] );

				const shouldIncludeConversionTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeConversionTailoredMetrics();

				expect( shouldIncludeConversionTailoredMetrics ).toEqual( [] );
			} );

			it( 'should return empty array if haveConversionEventsForTailoredMetrics is false', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [] );

				const haveConversionEventsForTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveConversionEventsForTailoredMetrics();

				// Since by default site purpose is `publish_blog` and we have no events detected
				// (or detected events are not matching this site purpose), haveConversionEventsForTailoredMetrics
				// will be false.
				expect( haveConversionEventsForTailoredMetrics ).toEqual(
					false
				);

				const shouldIncludeConversionTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeConversionTailoredMetrics();

				expect( shouldIncludeConversionTailoredMetrics ).toEqual( [] );
			} );

			it( 'should return detected events haveConversionEventsForTailoredMetrics is true and there are detected events', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

				const haveConversionEventsForTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveConversionEventsForTailoredMetrics();

				expect( haveConversionEventsForTailoredMetrics ).toEqual(
					true
				);

				const shouldIncludeConversionTailoredMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.shouldIncludeConversionTailoredMetrics();

				expect( shouldIncludeConversionTailoredMetrics ).toEqual( [
					ENUM_CONVERSION_EVENTS.CONTACT,
				] );
			} );
		} );

		describe( 'haveLostEventsForCurrentMetrics', () => {
			beforeEach( () => {
				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [],
					isWidgetHidden: false,
				} );
			} );

			it( 'should return false if no events associated with the current site purpose have been lost', () => {
				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( true );

				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: { values: [ 'publish_blog' ] },
					includeConversionEvents: {
						values: [ ENUM_CONVERSION_EVENTS.CONTACT ],
						scope: 'site',
					},
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
					lostEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
					newBadgeEvents: [],
				} );

				const haveLostEventsForCurrentMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveLostEventsForCurrentMetrics();

				expect( haveLostEventsForCurrentMetrics ).toEqual( false );
			} );

			it( 'should return true if events associated with the current site purpose have been lost', () => {
				registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( true );
				registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
					purpose: { values: [ 'publish_blog' ] },
					includeConversionEvents: {
						values: [ ENUM_CONVERSION_EVENTS.CONTACT ],
						scope: 'site',
					},
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [
						ENUM_CONVERSION_EVENTS.ADD_TO_CART,
					] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [],
					lostEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
					newBadgeEvents: [],
				} );

				const haveLostEventsForCurrentMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveLostEventsForCurrentMetrics();

				expect( haveLostEventsForCurrentMetrics ).toEqual( true );
			} );

			it( 'should return false if no events associated with the current manual selection have been lost', () => {
				provideKeyMetrics( registry, {
					widgetSlugs: [
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
					],
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
					lostEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
					newBadgeEvents: [],
				} );

				const haveLostEventsForCurrentMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveLostEventsForCurrentMetrics();

				expect( haveLostEventsForCurrentMetrics ).toEqual( false );
			} );

			it( 'should return false if no events associated with the current manual selection including conversion reporting metrics have been lost', () => {
				provideKeyMetrics( registry, {
					widgetSlugs: [
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_CITIES_DRIVING_ADD_TO_CART, // Conversion reporting metric for add_to_cart event.
					],
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
					lostEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
					newBadgeEvents: [],
				} );

				const haveLostEventsForCurrentMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveLostEventsForCurrentMetrics();

				expect( haveLostEventsForCurrentMetrics ).toEqual( false );
			} );

			it( 'should return true if there is at least one conversion event related metrics in manual selection', () => {
				provideKeyMetrics( registry, {
					widgetSlugs: [
						KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
						KM_ANALYTICS_NEW_VISITORS,
						KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
						KM_ANALYTICS_TOP_CITIES_DRIVING_LEADS, // Conversion reporting metric for contact event.
					],
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setDetectedEvents( [] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveModuleData( {
					newEvents: [ ENUM_CONVERSION_EVENTS.PURCHASE ],
					lostEvents: [ ENUM_CONVERSION_EVENTS.CONTACT ],
					newBadgeEvents: [],
				} );

				const haveLostEventsForCurrentMetrics = registry
					.select( MODULES_ANALYTICS_4 )
					.haveLostEventsForCurrentMetrics();

				expect( haveLostEventsForCurrentMetrics ).toEqual( true );
			} );
		} );
	} );
} );
