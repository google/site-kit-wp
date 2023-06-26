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
	freezeFetch,
	provideModules,
	render,
} from '../../../../../../tests/js/test-utils';
import { provideKeyMetrics } from '../../../../../../tests/js/utils';
import {
	CORE_USER,
	KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT,
	KM_SEARCH_CONSOLE_POPULAR_KEYWORDS,
} from '../../../../googlesitekit/datastore/user/constants';
import { withWidgetComponentProps } from '../../../../googlesitekit/widgets/util';
import ConnectAdSenseCTATileWidget from './ConnectAdSenseCTATileWidget';

describe( 'ConnectAdSenseCTATileWidget', () => {
	const WidgetWithComponentProps = withWidgetComponentProps(
		'keyMetricsConnectAdSenseCTATile'
	)( ConnectAdSenseCTATileWidget );

	const coreModileListEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/modules/data/list'
	);

	const coreKeyMetricsEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/key-metrics'
	);

	it( 'should render nothing when module list is not yet available', () => {
		freezeFetch( coreModileListEndpointRegExp );

		const { container } = render( <WidgetWithComponentProps /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when `adsense` is connected', () => {
		const { container } = render( <WidgetWithComponentProps />, {
			setupRegistry: ( registry ) =>
				provideModules( registry, [
					{
						slug: 'adsense',
						active: true,
						connected: true,
					},
				] ),
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when key metrics settings have not yet loaded', () => {
		freezeFetch( coreKeyMetricsEndpointRegExp );

		const { container } = render( <WidgetWithComponentProps />, {
			setupRegistry: ( registry ) =>
				provideModules( registry, [
					{
						slug: 'adsense',
						active: false,
						connected: false,
					},
				] ),
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing if there are no key metrics widgets', () => {
		const { container } = render( <WidgetWithComponentProps />, {
			setupRegistry: ( registry ) => {
				provideModules( registry, [
					{
						slug: 'adsense',
						active: false,
						connected: false,
					},
				] );
				provideKeyMetrics( registry, { widgetSlugs: [] } );
				registry
					.dispatch( CORE_USER )
					.receiveGetUserInputSettings( {} );
			},
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing if there are no adsense key metrics widgets', () => {
		const { container } = render( <WidgetWithComponentProps />, {
			setupRegistry: ( registry ) => {
				provideModules( registry, [
					{
						slug: 'adsense',
						active: false,
						connected: false,
					},
				] );
				provideKeyMetrics( registry, {
					widgetSlugs: [ KM_SEARCH_CONSOLE_POPULAR_KEYWORDS ],
				} );
			},
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render the widget if there is `adsense` key metrics widget', () => {
		freezeFetch(
			new RegExp( '^/google-site-kit/v1/core/user/data/permissions' )
		);
		const { container } = render( <WidgetWithComponentProps />, {
			setupRegistry: ( registry ) => {
				provideModules( registry, [
					{
						slug: 'adsense',
						active: false,
						connected: false,
					},
				] );
				provideKeyMetrics( registry, {
					widgetSlugs: [ KM_ANALYTICS_ADSENSE_TOP_EARNING_CONTENT ],
				} );
			},
		} );

		expect( container ).toHaveTextContent(
			'AdSense is disconnected, some of your metrics can’t be displayed'
		);
	} );
} );
