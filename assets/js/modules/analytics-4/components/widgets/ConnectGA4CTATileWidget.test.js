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
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '../../../../../../tests/js/test-utils';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import ConnectGA4CTATileWidget from './ConnectGA4CTATileWidget';

describe( 'ConnectGA4CTATileWidget', () => {
	const WidgetWithComponentProps = withWidgetComponentProps(
		'keyMetricsConnectGA4CTATile'
	)( ConnectGA4CTATileWidget );

	it( 'should render the Connect GA4 CTA tile', () => {
		const { container, getByText } = render( <WidgetWithComponentProps />, {
			setupRegistry: ( registry ) => {
				provideUserAuthentication( registry );
				provideUserCapabilities( registry );
				provideModules( registry );

				registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
					widgetSlugs: [
						KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
						KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
					],
					isWidgetHidden: false,
				} );
			},
		} );

		expect( container ).toMatchSnapshot();

		expect( getByText( 'Connect Analytics' ) ).toBeInTheDocument();
	} );
} );
