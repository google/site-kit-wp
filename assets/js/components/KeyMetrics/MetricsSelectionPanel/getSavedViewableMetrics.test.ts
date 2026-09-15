/**
 * GetSavedViewableMetrics tests.
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
 * Internal dependencies
 */
import { Select } from 'googlesitekit-data';
import { provideKeyMetricsWidgetRegistrations } from '@/js/components/KeyMetrics/test-utils';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_RETURNING_VISITORS,
} from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	muteFetch,
	provideKeyMetrics,
	provideModules,
	provideUserAuthentication,
} from '@tests/js/test-utils';
import getSavedViewableMetrics from './getSavedViewableMetrics';

const keyMetricsEndpoint = new RegExp(
	'^/google-site-kit/v1/core/user/data/key-metrics'
);

const SAVED_WIDGET_SLUGS = [
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_ANALYTICS_RETURNING_VISITORS,
];

describe( 'getSavedViewableMetrics', () => {
	let registry: ReturnType< typeof createTestRegistry >;
	let select: Select;

	beforeEach( () => {
		registry = createTestRegistry();
		select = registry.select as Select;

		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
			{
				slug: MODULE_SLUG_ADSENSE,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		provideKeyMetricsWidgetRegistrations( registry, {
			[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: {
				modules: [ MODULE_SLUG_ADSENSE ],
			},
			[ KM_ANALYTICS_RETURNING_VISITORS ]: {
				modules: [ MODULE_SLUG_ANALYTICS_4 ],
			},
		} );
	} );

	it( 'returns an empty array while getKeyMetrics() has not resolved', () => {
		muteFetch( keyMetricsEndpoint );

		expect( select( CORE_USER ).getKeyMetrics() ).toBeUndefined();
		expect(
			getSavedViewableMetrics( { select, isViewOnlyDashboard: false } )
		).toEqual( [] );
	} );

	it( 'drops a saved slug whose module is not shared with a view-only visitor', () => {
		provideUserAuthentication( registry, { authenticated: false } );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {
			'googlesitekit_read_shared_module_data::["analytics-4"]': true,
			'googlesitekit_read_shared_module_data::["adsense"]': false,
		} );
		provideKeyMetrics( registry, { widgetSlugs: SAVED_WIDGET_SLUGS } );

		expect(
			getSavedViewableMetrics( { select, isViewOnlyDashboard: true } )
		).toEqual( [ KM_ANALYTICS_RETURNING_VISITORS ] );
	} );

	it( 'keeps a saved slug whose widget has no displayInSelectionPanel gate', () => {
		provideUserAuthentication( registry );
		provideKeyMetrics( registry, { widgetSlugs: SAVED_WIDGET_SLUGS } );

		expect(
			getSavedViewableMetrics( { select, isViewOnlyDashboard: false } )
		).toEqual( SAVED_WIDGET_SLUGS );
	} );

	it( 'drops a saved slug hidden by its displayInSelectionPanel gate on a view-only dashboard, even though its module is shared', () => {
		provideUserAuthentication( registry, { authenticated: false } );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {
			'googlesitekit_read_shared_module_data::["analytics-4"]': true,
			'googlesitekit_read_shared_module_data::["adsense"]': true,
		} );
		provideKeyMetrics( registry, { widgetSlugs: SAVED_WIDGET_SLUGS } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { adSenseLinked: false } );

		expect(
			getSavedViewableMetrics( { select, isViewOnlyDashboard: true } )
		).toEqual( [ KM_ANALYTICS_RETURNING_VISITORS ] );
	} );

	it( 'keeps a saved slug whose displayInSelectionPanel gate passes on a view-only dashboard', () => {
		provideUserAuthentication( registry, { authenticated: false } );
		registry.dispatch( CORE_USER ).receiveGetCapabilities( {
			'googlesitekit_read_shared_module_data::["analytics-4"]': true,
			'googlesitekit_read_shared_module_data::["adsense"]': true,
		} );
		provideKeyMetrics( registry, { widgetSlugs: SAVED_WIDGET_SLUGS } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { adSenseLinked: true } );

		expect(
			getSavedViewableMetrics( { select, isViewOnlyDashboard: true } )
		).toEqual( SAVED_WIDGET_SLUGS );
	} );
} );
