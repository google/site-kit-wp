/**
 * ConnectGA4CTATileWidget component tests.
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
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '../../../../../../tests/js/test-utils';
import { KEY_METRICS_WIDGETS } from '../../../../components/KeyMetrics/key-metrics-widgets';
import { provideKeyMetricsWidgetRegistrations } from '../../../../components/KeyMetrics/test-utils';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '../../constants';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

describe( 'ConnectGA4CTATileWidget', () => {
	const WidgetWithComponentProps = withWidgetComponentProps(
		'keyMetricsConnectGA4CTATile'
	)( ConnectGA4CTATileWidget );

	it( 'should render the Connect GA4 CTA tile', () => {
		const registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );

		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [
				KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
				KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
			],
			isWidgetHidden: false,
		} );

		provideKeyMetricsWidgetRegistrations( registry, {
			[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: {
				modules: MODULE_SLUG_ANALYTICS_4,
			},
			[ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ]: {
				modules: MODULE_SLUG_ANALYTICS_4,
			},
		} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent( 'Connect Analytics' );

		expect( container ).toHaveTextContent(
			'Analytics is disconnected, some of your metrics can’t be displayed'
		);
	} );

	it( 'should render a title when only a single Connect GA4 CTA is present', () => {
		const registry = createTestRegistry();
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );

		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			widgetSlugs: [ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ],
			isWidgetHidden: false,
		} );
		registry.dispatch( CORE_USER ).receiveGetUserInputSettings( {
			purpose: {
				values: [ 'publish_blog' ],
				scope: 'site',
			},
		} );

		provideKeyMetricsWidgetRegistrations( registry, {
			[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: {
				modules: MODULE_SLUG_ANALYTICS_4,
			},
		} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent( 'Connect Analytics' );

		expect( container ).toHaveTextContent(
			'Analytics is disconnected, metric can’t be displayed'
		);

		expect( container ).toHaveTextContent(
			KEY_METRICS_WIDGETS[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]
				.title
		);
	} );
} );
