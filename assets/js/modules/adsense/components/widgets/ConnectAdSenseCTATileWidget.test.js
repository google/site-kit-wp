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
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
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
				slug: 'adsense',
				active: false,
				connected: false,
			},
		] );

		const { container } = render( <WidgetWithComponentProps />, {
			registry,
		} );

		expect( container ).toMatchSnapshot();

		expect( container ).toHaveTextContent( 'Connect AdSense' );
	} );
} );
