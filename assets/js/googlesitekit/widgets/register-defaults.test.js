/**
 * Widgets API defaults tests.
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
import getKeyMetricsPDFData from '@/js/components/KeyMetrics/getPDFData';
import { enabledFeatures } from '@/js/features';
import {
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_RETURNING_VISITORS,
} from '@/js/googlesitekit/datastore/user/constants';
import WidgetNull from '@/js/googlesitekit/widgets/components/WidgetNull';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from './default-areas';
import { registerDefaults } from './register-defaults';

/**
 * Builds a mock widgets API that records `registerWidget`/`registerWidgetArea`
 * calls so a test can inspect what `registerDefaults` registered.
 *
 * @since n.e.x.t
 *
 * @return {Object} The mock widgets API.
 */
function createWidgetsAPI() {
	return {
		registerWidget: jest.fn(),
		registerWidgetArea: jest.fn(),
		WIDGET_WIDTHS: { QUARTER: 'quarter', HALF: 'half', FULL: 'full' },
	};
}

/**
 * Finds the `registerWidget` call for the given slug on a mock widgets API.
 *
 * @since n.e.x.t
 *
 * @param {Object} widgetsAPI The mock widgets API.
 * @param {string} slug       The widget slug to find.
 * @return {Object|undefined} The registered `{ settings, areas }`, or `undefined`.
 */
function findWidgetRegistration( widgetsAPI, slug ) {
	const call = widgetsAPI.registerWidget.mock.calls.find(
		( [ registeredSlug ] ) => registeredSlug === slug
	);

	return call ? { settings: call[ 1 ], areas: call[ 2 ] } : undefined;
}

/**
 * Finds the `registerWidgetArea` call for the given slug on a mock widgets API.
 *
 * @since n.e.x.t
 *
 * @param {Object} widgetsAPI The mock widgets API.
 * @param {string} slug       The widget area slug to find.
 * @return {Object|undefined} The registered `{ settings, context }`, or `undefined`.
 */
function findWidgetAreaRegistration( widgetsAPI, slug ) {
	const call = widgetsAPI.registerWidgetArea.mock.calls.find(
		( [ registeredSlug ] ) => registeredSlug === slug
	);

	return call ? { settings: call[ 1 ], context: call[ 2 ] } : undefined;
}

/**
 * Builds a `select` stand-in whose `getKeyMetrics()` returns the given slugs.
 *
 * @since n.e.x.t
 *
 * @param {string[]} keyMetrics The key metric slugs to return.
 * @return {Function} A `select` stand-in.
 */
function selectWithKeyMetrics( keyMetrics ) {
	return () => ( {
		getKeyMetrics: () => keyMetrics,
	} );
}

describe( 'registerDefaults - keyMetricsPDFSection', () => {
	afterEach( () => {
		enabledFeatures.delete( 'pdfGeneration' );
	} );

	it( 'registers the aggregate widget in the Key Metrics area when pdfGeneration is enabled', () => {
		enabledFeatures.add( 'pdfGeneration' );

		const widgetsAPI = createWidgetsAPI();
		registerDefaults( widgetsAPI );

		const registration = findWidgetRegistration(
			widgetsAPI,
			'keyMetricsPDFSection'
		);

		expect( registration ).toBeDefined();
		// Renders nothing on the dashboard so no grid slot is occupied.
		expect( registration.settings.Component ).toBe( WidgetNull );
		// Excluded from the view-only PDF when Analytics 4 is not shared.
		expect( registration.settings.modules ).toEqual( [
			MODULE_SLUG_ANALYTICS_4,
		] );
		expect( registration.areas ).toContain(
			AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
		);

		const { pdf } = registration.settings;
		expect( pdf.Component ).toBeDefined();
		expect( pdf.getData ).toBe( getKeyMetricsPDFData );
		expect( typeof pdf.isActive ).toBe( 'function' );
		// A single-widget area, so the sub-section heading is suppressed.
		expect( pdf.label ).toBeUndefined();
	} );

	it( 'registers the Key Metrics area with a plain-string pdfTitle for the PDF export', () => {
		const widgetsAPI = createWidgetsAPI();
		registerDefaults( widgetsAPI );

		const area = findWidgetAreaRegistration(
			widgetsAPI,
			AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY
		);

		expect( area ).toBeDefined();
		// The dashboard `title` is a React fragment (it carries the "New"
		// badge), which react-pdf cannot render. The area must expose a plain
		// string `pdfTitle` so the exported Key Metrics section gets a valid
		// title instead of the fragment.
		expect( typeof area.settings.pdfTitle ).toBe( 'string' );
		expect( area.settings.pdfTitle ).toBe( 'Key metrics' );
	} );

	it( 'does not register the aggregate widget when pdfGeneration is disabled', () => {
		const widgetsAPI = createWidgetsAPI();
		registerDefaults( widgetsAPI );

		expect(
			findWidgetRegistration( widgetsAPI, 'keyMetricsPDFSection' )
		).toBeUndefined();
	} );

	it( 'pdf.isActive is true only when a configured metric has a pdfTile config', () => {
		enabledFeatures.add( 'pdfGeneration' );

		const widgetsAPI = createWidgetsAPI();
		registerDefaults( widgetsAPI );

		const { settings } = findWidgetRegistration(
			widgetsAPI,
			'keyMetricsPDFSection'
		);

		// New Visitors has a pdfTile config.
		expect(
			settings.pdf.isActive(
				selectWithKeyMetrics( [ KM_ANALYTICS_NEW_VISITORS ] )
			)
		).toBe( true );

		// Returning Visitors does not, so a selection with only it is inactive.
		expect(
			settings.pdf.isActive(
				selectWithKeyMetrics( [ KM_ANALYTICS_RETURNING_VISITORS ] )
			)
		).toBe( false );

		// No selection resolved yet.
		expect(
			settings.pdf.isActive( selectWithKeyMetrics( undefined ) )
		).toBe( false );
	} );
} );
