/**
 * Shared test registry setup for the "Selling products" Key Metrics widgets.
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
 * External dependencies
 */
import { ComponentType } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { withConnected } from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '@/js/util/errors';
import { render } from '@tests/js/test-utils';
import {
	provideKeyMetrics,
	provideModuleRegistrations,
	provideModules,
} from '@tests/js/utils';

type WidgetProps = ReturnType< typeof getWidgetComponentProps >;

/**
 * Configures a test registry with a connected Analytics-4 module, Key
 * Metrics settings, and a detected "purchase" conversion event.
 *
 * Shared setup for the "Selling products" Key Metrics widget tests
 * (SalesRateWidget, TotalSalesWidget, TopPagesDrivingSalesWidget, etc).
 *
 * @since n.e.x.t
 *
 * @param {Object} registry Data registry to configure.
 * @return {void}
 */
export function provideSalesWidgetTestRegistry(
	registry: WPDataRegistry
): void {
	registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-08' );
	provideKeyMetrics( registry );
	provideModules(
		registry,
		withConnected( MODULE_SLUG_ANALYTICS_4 ) as Parameters<
			typeof provideModules
		>[ 1 ]
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
}

/**
 * The Analytics 4 report endpoint, matched regardless of query args.
 *
 * Shared by every "Selling products" widget test, since intercepting it with
 * an error response exercises each tile's error UI the same way, no matter
 * which specific report(s) the tile itself requests.
 *
 * @since n.e.x.t
 */
export const SALES_WIDGET_REPORT_ENDPOINT = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

/**
 * Registers the shared "generic report error" test for a Selling products widget.
 *
 * @since n.e.x.t
 *
 * @param {Function}      getRegistry Returns the current test's registry (called lazily, after `beforeEach` has run).
 * @param {ComponentType} Component   The widget component under test.
 * @param {Object}        widgetProps The widget's `getWidgetComponentProps()` props.
 * @return {void}
 */
export function testGenericReportError(
	getRegistry: () => WPDataRegistry,
	Component: ComponentType< WidgetProps >,
	widgetProps: WidgetProps
): void {
	it( 'should render the generic error variant when the report fetch fails', async () => {
		const registry = getRegistry();
		provideModuleRegistrations( registry );

		const errorResponse = {
			code: ERROR_INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
			data: { reason: ERROR_INTERNAL_SERVER_ERROR },
		};

		fetchMock.get( SALES_WIDGET_REPORT_ENDPOINT, {
			body: errorResponse,
			status: 500,
		} );

		const { container, getByText, waitForRegistry } = render(
			<Component { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Data loading failed/i ) ).toBeInTheDocument();
	} );
}

/**
 * Registers the shared "insufficient permissions" error test for a Selling products widget.
 *
 * Only the `MetricTileTable`-based tiles use this - the `MetricTileNumeric`
 * ones don't have a dedicated insufficient-permissions variant.
 *
 * @since n.e.x.t
 *
 * @param {Function}      getRegistry Returns the current test's registry (called lazily, after `beforeEach` has run).
 * @param {ComponentType} Component   The widget component under test.
 * @param {Object}        widgetProps The widget's `getWidgetComponentProps()` props.
 * @return {void}
 */
export function testInsufficientPermissionsError(
	getRegistry: () => WPDataRegistry,
	Component: ComponentType< WidgetProps >,
	widgetProps: WidgetProps
): void {
	it( 'should render the insufficient permissions error variant when the report fetch fails', async () => {
		const registry = getRegistry();

		const errorResponse = {
			code: 'test_error',
			message: 'Error message.',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		fetchMock.get( SALES_WIDGET_REPORT_ENDPOINT, {
			body: errorResponse,
			status: 500,
		} );

		const { container, getByText, waitForRegistry } = render(
			<Component { ...widgetProps } />,
			{ registry }
		);
		await waitForRegistry();

		expect( console ).toHaveErrored();

		expect(
			container.querySelector( '.googlesitekit-km-widget-tile--error' )
		).toBeInTheDocument();
		expect( getByText( /Insufficient permissions/i ) ).toBeInTheDocument();
	} );
}
