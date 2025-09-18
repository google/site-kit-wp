/**
 * Hook useCurrentlyActiveEvents tests.
 *
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
import {
	createTestRegistry,
	renderHook,
	provideUserAuthentication,
} from '../../../../../tests/js/test-utils';
import useCurrentlyActiveEvents from './useCurrentlyActiveEvents';
import {
	CORE_USER,
	KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
	KM_ANALYTICS_NEW_VISITORS,
} from '@/js/googlesitekit/datastore/user/constants';
import { registerStore as registerAnalytics4Store } from '@/js/modules/analytics-4/datastore';

describe( 'useCurrentlyActiveEvents', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserAuthentication( registry );
		registerAnalytics4Store( registry );
	} );

	it( 'returns events based on user picked metrics when present', async () => {
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [
				KM_ANALYTICS_TOP_PAGES_DRIVING_LEADS,
				KM_ANALYTICS_NEW_VISITORS,
			],
			isWidgetHidden: false,
		} );

		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			includeConversionEvents: { values: [], scope: 'site' },
		} );

		const { result, waitForRegistry } = renderHook(
			() => useCurrentlyActiveEvents(),
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( result.current ).toEqual(
			expect.arrayContaining( [
				'contact',
				'submit_lead_form',
				'generate_lead',
			] )
		);
	} );

	it( 'falls back to user input settings includeConversionEvents when no user picked metrics', async () => {
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			includeConversionEvents: {
				values: [ 'purchase' ],
				scope: 'site',
			},
		} );

		const { result, waitForRegistry } = renderHook(
			() => useCurrentlyActiveEvents(),
			{
				registry,
			}
		);

		await waitForRegistry();
		expect( result.current ).toEqual( [ 'purchase' ] );
	} );
} );
