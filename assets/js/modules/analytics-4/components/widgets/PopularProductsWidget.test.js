/**
 * PopularProductsWidget component tests.
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
	freezeFetch,
	provideKeyMetrics,
	render,
} from '../../../../../../tests/js/test-utils';
import { KM_ANALYTICS_POPULAR_PRODUCTS } from '../../../../googlesitekit/datastore/user/constants';
import { coreKeyMetricsEndpointRegExp } from '../../../../googlesitekit/datastore/user/key-metrics.test';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import PopularProductsWidget from './PopularProductsWidget';

describe( 'PopularProductsWidget', () => {
	const WidgetWithComponentProps = withWidgetComponentProps(
		KM_ANALYTICS_POPULAR_PRODUCTS
	)( PopularProductsWidget );

	it( 'should not render anything when isKeyMetricsWidgetHidden is not loaded', () => {
		freezeFetch( coreKeyMetricsEndpointRegExp );
		const { container } = render( <WidgetWithComponentProps /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not render anything when isKeyMetricsWidgetHidden is true', () => {
		const { container } = render( <WidgetWithComponentProps />, {
			setupRegistry: ( registry ) =>
				provideKeyMetrics( registry, {
					isWidgetHidden: true,
				} ),
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the widget when isKeyMetricsWidgetHidden is false', () => {
		const { getByText } = render( <WidgetWithComponentProps />, {
			setupRegistry: provideKeyMetrics,
		} );

		expect(
			getByText( 'TODO: UI for PopularProductsWidget' )
		).toBeInTheDocument();
	} );
} );
