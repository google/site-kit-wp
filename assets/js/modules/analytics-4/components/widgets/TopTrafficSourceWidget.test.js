/**
 * TopTrafficSourceWidget component tests.
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
import { freezeFetch, render } from '../../../../../../tests/js/test-utils';
import { KM_ANALYTICS_TOP_TRAFFIC_SOURCE } from '../../../../googlesitekit/widgets/datastore/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import {
	coreKeyMetricsEndpointRegExp,
	setupRegistryKeyMetricsWidgetHidden,
	setupRegistryKeyMetricsWidgetNotHidden,
} from '../../../../util/key-metrics';
import TopTrafficSourceWidget from './TopTrafficSourceWidget';

describe( 'TopTrafficSourceWidget', () => {
	const WidgetWithComponentProps = withWidgetComponentProps(
		KM_ANALYTICS_TOP_TRAFFIC_SOURCE
	)( TopTrafficSourceWidget );

	it( 'should not render anything when isKeyMetricsWidgetHidden is not loaded', () => {
		freezeFetch( coreKeyMetricsEndpointRegExp );
		const { container } = render( <WidgetWithComponentProps /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render anything when isKeyMetricsWidgetHidden is true', () => {
		const { container } = render( <WidgetWithComponentProps />, {
			setupRegistry: setupRegistryKeyMetricsWidgetHidden,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the widget when isKeyMetricsWidgetHidden is false', () => {
		const { getByText } = render( <WidgetWithComponentProps />, {
			setupRegistry: setupRegistryKeyMetricsWidgetNotHidden,
		} );

		expect(
			getByText( 'TODO: UI for TopTrafficSourceWidget' )
		).toBeInTheDocument();
	} );
} );
