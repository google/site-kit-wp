/**
 * `useConversionReportingEventsForTailoredMetrics` hook tests.
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
	provideKeyMetricsUserInputSettings,
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { renderHook, actHook as act } from '../../../../../tests/js/test-utils';
import { useConversionReportingEventsForTailoredMetrics } from './useConversionReportingEventsForTailoredMetrics';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';

describe( 'useConversionReportingEventsForTailoredMetrics', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideKeyMetricsUserInputSettings( registry );

		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: {
				values: [ 'publish_blog' ],
				scope: 'site',
			},
		} );

		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: false,
		} );
	} );

	it( 'should return true when detectedEvents have an event associated with ACR KWM for the passed purpose', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ 'contact' ] );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() =>
					useConversionReportingEventsForTailoredMetrics(
						'publish_blog'
					),
				{ registry, features: [ 'conversionReporting' ] }
			) );
		} );

		expect( result.current ).toEqual( true );
	} );

	it( 'should return true when new detected events have an event associated with ACR KWM for the passed purpose when useNewEvents is passed', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveConversionReportingInlineData( {
				newEvents: [ 'contact' ],
				lostEvents: [],
			} );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() =>
					useConversionReportingEventsForTailoredMetrics(
						'publish_blog',
						true
					),
				{ registry, features: [ 'conversionReporting' ] }
			) );
		} );

		expect( result.current ).toEqual( true );
	} );

	it( 'should return false when detectedEvents do not have an event associated with ACR KWM for the passed purpose', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setDetectedEvents( [] );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() =>
					useConversionReportingEventsForTailoredMetrics(
						'publish_blog'
					),
				{ registry, features: [ 'conversionReporting' ] }
			) );
		} );

		expect( result.current ).toEqual( false );
	} );

	it( 'should return false when new detected events do not have an event associated with ACR KWM for the passed purpose when useNewEvents is passed', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveConversionReportingInlineData( {
				newEvents: [ 'add_to_cart' ],
				lostEvents: [],
			} );

		let result;
		await act( async () => {
			( { result } = await renderHook(
				() =>
					useConversionReportingEventsForTailoredMetrics(
						'publish_blog',
						true
					),
				{ registry, features: [ 'conversionReporting' ] }
			) );
		} );

		expect( result.current ).toEqual( false );
	} );
} );
