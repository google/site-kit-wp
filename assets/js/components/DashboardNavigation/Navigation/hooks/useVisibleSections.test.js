/**
 * Navigation `useVisibleSections` hook tests.
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
	provideModules,
} from '../../../../../../tests/js/utils';
import { renderHook } from '../../../../../../tests/js/test-utils';
import useVisibleSections, { contexts } from './useVisibleSections';
import {
	ANCHOR_ID_CONTENT,
	ANCHOR_ID_KEY_METRICS,
	ANCHOR_ID_SPEED,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	CONTEXT_MAIN_DASHBOARD_CONTENT,
	CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
	CONTEXT_MAIN_DASHBOARD_MONETIZATION,
	CONTEXT_MAIN_DASHBOARD_SPEED,
	CONTEXT_MAIN_DASHBOARD_TRAFFIC,
} from '@/js/googlesitekit/widgets/default-contexts';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_WIDGETS } from '@/js/googlesitekit/widgets/datastore/constants';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';

function provideWidgetContexts( registry, widgetContexts = [] ) {
	const mapContextToModule = {
		[ CONTEXT_MAIN_DASHBOARD_KEY_METRICS ]: [ MODULE_SLUG_ANALYTICS_4 ],
		[ CONTEXT_MAIN_DASHBOARD_TRAFFIC ]: [
			MODULE_SLUG_ANALYTICS_4,
			MODULE_SLUG_SEARCH_CONSOLE,
		],
		[ CONTEXT_MAIN_DASHBOARD_CONTENT ]: [
			MODULE_SLUG_ANALYTICS_4,
			MODULE_SLUG_SEARCH_CONSOLE,
		],
		[ CONTEXT_MAIN_DASHBOARD_SPEED ]: [ MODULE_SLUG_PAGESPEED_INSIGHTS ],
		[ CONTEXT_MAIN_DASHBOARD_MONETIZATION ]: [ MODULE_SLUG_ADSENSE ],
	};

	widgetContexts.forEach( ( context, index ) => {
		registry
			.dispatch( CORE_WIDGETS )
			.registerWidgetArea( `TestArea${ index }`, {
				title: 'Test Header',
				subtitle: 'Cool stuff for yoursite.com',
				style: 'composite',
			} );

		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea( `TestArea${ index }`, context );

		registry
			.dispatch( CORE_WIDGETS )
			.registerWidget( `TestWidget${ index }`, {
				Component() {
					return <div>Test Widget</div>;
				},
				modules: mapContextToModule[ context ],
			} );

		registry
			.dispatch( CORE_WIDGETS )
			.assignWidget( `TestWidget${ index }`, `TestArea${ index }` );
	} );
}

describe( 'useVisibleSections', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: false,
		} );
	} );

	it( 'returns all visible sections for main dashboard when all widgets are active', async () => {
		provideWidgetContexts(
			registry,
			Object.values( contexts[ VIEW_CONTEXT_MAIN_DASHBOARD ] )
		);

		const { result } = await renderHook( () => useVisibleSections(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current ).toEqual(
			Object.keys( contexts[ VIEW_CONTEXT_MAIN_DASHBOARD ] )
		);
	} );

	it( 'does not include key metrics section if it is hidden', async () => {
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [],
			isWidgetHidden: true,
		} );

		provideWidgetContexts(
			registry,
			Object.values( contexts[ VIEW_CONTEXT_MAIN_DASHBOARD ] )
		);

		const { result } = await renderHook( () => useVisibleSections(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current ).toEqual(
			Object.keys( contexts[ VIEW_CONTEXT_MAIN_DASHBOARD ] ).filter(
				( section ) => section !== ANCHOR_ID_KEY_METRICS
			)
		);
	} );

	it( 'returns only active widget sections', async () => {
		provideWidgetContexts( registry, [
			CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
			CONTEXT_MAIN_DASHBOARD_CONTENT,
		] );

		const { result } = await renderHook( () => useVisibleSections(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current ).toEqual( [
			ANCHOR_ID_KEY_METRICS,
			ANCHOR_ID_CONTENT,
		] );
	} );

	it( 'returns correct sections for entity dashboard', async () => {
		provideWidgetContexts( registry, [
			CONTEXT_MAIN_DASHBOARD_KEY_METRICS,
			...Object.values( contexts[ VIEW_CONTEXT_ENTITY_DASHBOARD ] ),
		] );

		const { result } = await renderHook( () => useVisibleSections(), {
			registry,
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
		} );

		expect( result.current ).toEqual(
			Object.keys( contexts[ VIEW_CONTEXT_ENTITY_DASHBOARD ] )
		);
	} );

	it( 'filters sections by viewable modules in view-only mode', async () => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: MODULE_SLUG_ANALYTICS_4,
				shareable: true,
			},
		] );

		registry.dispatch( CORE_USER ).receiveGetCapabilities( {
			googlesitekit_view_dashboard: true,
			googlesitekit_manage_options: true,
			'googlesitekit_read_shared_module_data::["site-verification"]': false,
			'googlesitekit_read_shared_module_data::["tagmanager"]': false,
			'googlesitekit_read_shared_module_data::["adsense"]': false,
			'googlesitekit_read_shared_module_data::["search-console"]': false,
			'googlesitekit_read_shared_module_data::["analytics-4"]': true,
			'googlesitekit_read_shared_module_data::["pagespeed-insights"]': true,
		} );

		provideWidgetContexts(
			registry,
			Object.values( contexts[ VIEW_CONTEXT_MAIN_DASHBOARD ] )
		);

		const { result } = await renderHook( () => useVisibleSections(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( result.current ).toEqual( [
			ANCHOR_ID_KEY_METRICS,
			ANCHOR_ID_SPEED,
		] );
	} );

	it( 'returns empty array if no widget contexts are active', async () => {
		const { result } = await renderHook( () => useVisibleSections(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current ).toEqual( [] );
	} );
} );
