/**
 * `isActivePDFWidget` tests.
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
import { Widget } from '@/js/googlesitekit/widgets/types';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import {
	createTestRegistry,
	muteFetch,
	provideModules,
} from '@tests/js/test-utils';
import { isActivePDFWidget } from './pdf-widget-eligibility';

function NullComponent() {
	return null;
}

/**
 * Builds a test widget with a pdf config, merging any overrides so each test
 * sets only the fields it needs.
 *
 * @since n.e.x.t
 *
 * @param overrides Widget fields to merge over the defaults.
 * @return The widget to pass to `isActivePDFWidget`.
 */
function createWidget( overrides: Partial< Widget > = {} ): Widget {
	return {
		slug: 'testWidget',
		Component: NullComponent,
		priority: 1,
		width: 'full',
		wrapWidget: false,
		pdf: {
			Component: NullComponent,
			getData: () => Promise.resolve( { data: null } ),
		},
		...overrides,
	};
}

describe( 'isActivePDFWidget', () => {
	let registry: ReturnType< typeof createTestRegistry >;
	let select: Select;

	beforeEach( () => {
		registry = createTestRegistry();
		// `createTestRegistry` types `select` as `Function`. Narrow it to
		// `Select` so the tests can pass it to `isActivePDFWidget`.
		select = registry.select as Select;
	} );

	it( 'returns false for a widget without a pdf config', () => {
		provideModules( registry );

		const widget = createWidget( { pdf: undefined } );

		expect( isActivePDFWidget( widget, select ) ).toBe( false );
	} );

	it( 'returns true for a pdf widget that depends on no module', () => {
		provideModules( registry );

		const widget = createWidget( { modules: undefined } );

		expect( isActivePDFWidget( widget, select ) ).toBe( true );
	} );

	it( 'returns false when a required module is disconnected', () => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: false },
		] );

		const widget = createWidget( { modules: [ MODULE_SLUG_ANALYTICS_4 ] } );

		expect( isActivePDFWidget( widget, select ) ).toBe( false );
	} );

	it( 'returns true when the required module is connected', () => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );

		const widget = createWidget( { modules: [ MODULE_SLUG_ANALYTICS_4 ] } );

		expect( isActivePDFWidget( widget, select ) ).toBe( true );
	} );

	it( 'returns false when any required module is disconnected', () => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_SEARCH_CONSOLE, active: true, connected: true },
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: false },
		] );

		const widget = createWidget( {
			modules: [ MODULE_SLUG_SEARCH_CONSOLE, MODULE_SLUG_ANALYTICS_4 ],
		} );

		expect( isActivePDFWidget( widget, select ) ).toBe( false );
	} );

	it( 'returns false while modules are still loading', () => {
		// Without `provideModules`, `isModuleConnected` returns `undefined` and
		// starts the modules resolver. Mute its request. The test proves a
		// not-yet-loaded module never counts as connected.
		muteFetch(
			new RegExp( '^/google-site-kit/v1/core/modules/data/list' )
		);

		const widget = createWidget( { modules: [ MODULE_SLUG_ANALYTICS_4 ] } );

		expect( isActivePDFWidget( widget, select ) ).toBe( false );
	} );

	it( 'returns false when pdf.isActive returns false even though the module is connected', () => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );

		const widget = createWidget( {
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			pdf: {
				Component: NullComponent,
				getData: () => Promise.resolve( { data: null } ),
				isActive: () => false,
			},
		} );

		expect( isActivePDFWidget( widget, select ) ).toBe( false );
	} );

	it( 'returns true when pdf.isActive returns true and the module is connected', () => {
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );

		const widget = createWidget( {
			modules: [ MODULE_SLUG_ANALYTICS_4 ],
			pdf: {
				Component: NullComponent,
				getData: () => Promise.resolve( { data: null } ),
				isActive: () => true,
			},
		} );

		expect( isActivePDFWidget( widget, select ) ).toBe( true );
	} );
} );
