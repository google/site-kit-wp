/**
 * ConnectGA4CTAWidget component tests.
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

/**
 * Internal dependencies
 */
import ConnectGA4CTAWidget from './ConnectGA4CTAWidget';
import {
	KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
	KM_ANALYTICS_LOYAL_VISITORS,
	KM_ANALYTICS_NEW_VISITORS,
	KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
} from '../../googlesitekit/datastore/user/constants';
import {
	render,
	createTestRegistry,
	provideKeyMetrics,
	provideUserAuthentication,
	provideUserCapabilities,
	provideModules,
} from '../../../../tests/js/test-utils';
import { withWidgetComponentProps } from '../../googlesitekit/widgets/util';
import { CORE_WIDGETS } from '../../googlesitekit/widgets/datastore/constants';
import { AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY } from '../../googlesitekit/widgets/default-areas';
import { CONTEXT_MAIN_DASHBOARD_KEY_METRICS } from '../../googlesitekit/widgets/default-contexts';

describe( 'ConnectGA4CTAWidget', () => {
	let registry;

	const WidgetWithComponentProps = withWidgetComponentProps(
		'keyMetricsConnectGA4CTA'
	)( ConnectGA4CTAWidget );

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideKeyMetrics( registry );

		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: false,
				connected: false,
			},
		] );
	} );

	it( 'should not render unless at least 3 analytics dependant metrics are registered', async () => {
		const keyMetricWidgets = {
			[ KM_ANALYTICS_LOYAL_VISITORS ]: [ 'analytics-4' ],
			[ KM_ANALYTICS_NEW_VISITORS ]: [ 'analytics-4' ],
			[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: [ 'adsense' ],
			[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: [ 'search-console' ],
		};

		provideKeyMetrics( registry, {
			widgetSlugs: Object.keys( keyMetricWidgets ),
		} );

		registry
			.dispatch( CORE_WIDGETS )
			.registerWidgetArea( AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY, {
				title: 'Key metrics',
			} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea(
				AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
				CONTEXT_MAIN_DASHBOARD_KEY_METRICS
			);

		Object.keys( keyMetricWidgets ).forEach( ( slug ) => {
			registry.dispatch( CORE_WIDGETS ).registerWidget( slug, {
				Component: () => <div>Hello test.</div>,
				modules: keyMetricWidgets[ slug ],
			} );
			registry
				.dispatch( CORE_WIDGETS )
				.assignWidget( slug, AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY );
		} );

		const { container, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render if widget is not dismissed, user input is completed, GA4 is not connected, and at least 3 analytics dependant metrics are registered', async () => {
		const keyMetricWidgets = [
			KM_ANALYTICS_LOYAL_VISITORS,
			KM_ANALYTICS_NEW_VISITORS,
			KM_ANALYTICS_TOP_TRAFFIC_SOURCE,
			KM_ANALYTICS_ENGAGED_TRAFFIC_SOURCE,
		];

		provideKeyMetrics( registry, {
			widgetSlugs: keyMetricWidgets,
		} );

		registry
			.dispatch( CORE_WIDGETS )
			.registerWidgetArea( AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY, {
				title: 'Key metrics',
			} );
		registry
			.dispatch( CORE_WIDGETS )
			.assignWidgetArea(
				AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY,
				CONTEXT_MAIN_DASHBOARD_KEY_METRICS
			);

		keyMetricWidgets.forEach( ( slug ) => {
			registry.dispatch( CORE_WIDGETS ).registerWidget( slug, {
				Component: () => <div>Hello test.</div>,
				modules: [ 'analytics-4' ],
			} );
			registry
				.dispatch( CORE_WIDGETS )
				.assignWidget( slug, AREA_MAIN_DASHBOARD_KEY_METRICS_PRIMARY );
		} );

		const { container, getByRole, waitForRegistry } = render(
			<WidgetWithComponentProps />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-publisher-win__title' )
		).toHaveTextContent( 'Google Analytics is disconnected' );
		const button = getByRole( 'button', {
			name: /Connect Google Analytics/i,
		} );
		expect( button ).toBeInTheDocument();
	} );
} );
