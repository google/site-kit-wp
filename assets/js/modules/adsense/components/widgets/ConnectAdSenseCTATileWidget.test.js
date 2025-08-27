/**
 * ConnectAdSenseCTATileWidget component tests.
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
	provideUserCapabilities,
	render,
} from '../../../../../../tests/js/test-utils';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { KEY_METRICS_WIDGETS } from '@/js/components/KeyMetrics/key-metrics-widgets';
import { KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT } from '@/js/googlesitekit/datastore/user/constants';
import { provideKeyMetricsWidgetRegistrations } from '@/js/components/KeyMetrics/test-utils';
import { withWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import ConnectAdSenseCTATileWidget from './ConnectAdSenseCTATileWidget';

describe( 'ConnectAdSenseCTATileWidget', () => {
	const WidgetWithComponentProps = withWidgetComponentProps(
		'keyMetricsConnectAdSenseCTATile'
	)( ConnectAdSenseCTATileWidget );

	it( 'should render the Connect AdSense CTA tile', () => {
		const registry = createTestRegistry();
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ADSENSE,
				active: false,
				connected: false,
			},
		] );
		provideKeyMetricsWidgetRegistrations( registry, {
			[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: {
				modules: [ MODULE_SLUG_ADSENSE ],
			},
			secondAdSenseWidget: {
				modules: [ MODULE_SLUG_ADSENSE ],
			},
		} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent( 'Connect AdSense' );

		expect( container ).toHaveTextContent(
			'AdSense is disconnected, some of your metrics can’t be displayed'
		);
	} );

	it( 'should render a title when only a single Connect AdSense CTA is present', () => {
		const registry = createTestRegistry();
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ADSENSE,
				active: false,
				connected: false,
			},
		] );
		provideKeyMetricsWidgetRegistrations( registry, {
			[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]: {
				modules: [ MODULE_SLUG_ADSENSE ],
			},
		} );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent( 'Connect AdSense' );

		expect( container ).toHaveTextContent(
			'AdSense is disconnected, metric can’t be displayed'
		);

		expect( container ).toHaveTextContent(
			KEY_METRICS_WIDGETS[ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ]
				.title
		);
	} );
} );
