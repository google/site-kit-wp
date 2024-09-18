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
} from '../../../../../tests/js/utils';

describe( 'modules/analytics-4 conversion-reporting', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideModules( registry );
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
	} );
} );
