/**
 * Shared, endpoint-agnostic test helpers for Key Metrics widget test registries.
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
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import {
	ERROR_INTERNAL_SERVER_ERROR,
	ERROR_REASON_INSUFFICIENT_PERMISSIONS,
} from '@/js/util/errors';
import { render } from '@tests/js/test-utils';
import { provideModuleRegistrations } from '@tests/js/utils';

type WidgetProps = ReturnType< typeof getWidgetComponentProps >;

/**
 * The Analytics 4 report endpoint, matched regardless of query args.
 *
 * Shared by every Key Metrics widget test family ("Selling products",
 * "Generating leads", etc), since intercepting it with an error response
 * exercises each tile's error UI the same way, no matter which specific
 * report(s) the tile itself requests.
 *
 * @since n.e.x.t
 */
export const KEY_METRICS_WIDGET_REPORT_ENDPOINT = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

/**
 * Registers the shared "generic report error" test for a Key Metrics widget.
 *
 * @since n.e.x.t
 *
 * @param {Function}      getRegistry    Returns the current test's registry (called lazily, after `beforeEach` has run).
 * @param {ComponentType} Component      The widget component under test.
 * @param {Object}        widgetProps    The widget's `getWidgetComponentProps()` props.
 * @param {RegExp}        reportEndpoint The Analytics 4 report endpoint to intercept for this widget family.
 * @return {void}
 */
export function testGenericReportError(
	getRegistry: () => WPDataRegistry,
	Component: ComponentType< WidgetProps >,
	widgetProps: WidgetProps,
	reportEndpoint: RegExp
): void {
	it( 'should render the generic error variant when the report fetch fails', async () => {
		const registry = getRegistry();
		provideModuleRegistrations( registry );

		const errorResponse = {
			code: ERROR_INTERNAL_SERVER_ERROR,
			message: 'Internal server error',
			data: { reason: ERROR_INTERNAL_SERVER_ERROR },
		};

		fetchMock.get( reportEndpoint, {
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
 * Registers the shared "insufficient permissions" error test for a Key Metrics widget.
 *
 * Only the `MetricTileTable`-based tiles use this - the `MetricTileNumeric`
 * ones don't have a dedicated insufficient-permissions variant.
 *
 * @since n.e.x.t
 *
 * @param {Function}      getRegistry    Returns the current test's registry (called lazily, after `beforeEach` has run).
 * @param {ComponentType} Component      The widget component under test.
 * @param {Object}        widgetProps    The widget's `getWidgetComponentProps()` props.
 * @param {RegExp}        reportEndpoint The Analytics 4 report endpoint to intercept for this widget family.
 * @return {void}
 */
export function testInsufficientPermissionsError(
	getRegistry: () => WPDataRegistry,
	Component: ComponentType< WidgetProps >,
	widgetProps: WidgetProps,
	reportEndpoint: RegExp
): void {
	it( 'should render the insufficient permissions error variant when the report fetch fails', async () => {
		const registry = getRegistry();

		const errorResponse = {
			code: 'test_error',
			message: 'Error message.',
			data: { reason: ERROR_REASON_INSUFFICIENT_PERMISSIONS },
		};

		fetchMock.get( reportEndpoint, {
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
