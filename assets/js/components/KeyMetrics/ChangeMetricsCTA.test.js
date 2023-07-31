/**
 * Key Metrics ChangeMetricsCTA component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

import {
	createTestRegistry,
	freezeFetch,
	provideKeyMetrics,
	render,
} from '../../../../tests/js/test-utils';
import ChangeMetricsCTA from './ChangeMetricsCTA';

describe( 'ChangeMetricsCTA', () => {
	let registry;

	const coreKeyMetricsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/key-metrics'
	);
	const coreUserInputSettingsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/user-input-settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		freezeFetch( coreKeyMetricsEndpointRegExp );
		freezeFetch( coreUserInputSettingsEndpointRegExp );
	} );

	it( 'should not render if key metrics are undefined', () => {
		provideKeyMetrics( registry, { widgetSlugs: undefined } );

		const { queryByRole } = render( <ChangeMetricsCTA />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).not.toBeInTheDocument();
	} );

	it( 'should not render if no key metrics are selected', () => {
		provideKeyMetrics( registry, { widgetSlugs: [] } );

		const { queryByRole } = render( <ChangeMetricsCTA />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).not.toBeInTheDocument();
	} );

	it( 'should render a button to change metrics', () => {
		provideKeyMetrics( registry, { widgetSlugs: [ 'metricA' ] } );

		const { queryByRole } = render( <ChangeMetricsCTA />, { registry } );

		const button = queryByRole( 'button' );
		expect( button ).toBeInTheDocument();
		expect( button ).toHaveTextContent( 'Change Metrics' );
	} );
} );
