/**
 * SearchFunnelWidgetGA4 component tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	render,
	createTestRegistry,
	provideModules,
	provideUserCapabilities,
	provideUserInfo,
	provideUserAuthentication,
	provideSiteInfo,
	muteFetch,
} from '../../../../../../../tests/js/test-utils';
import coreModulesFixture from '../../../../../googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../../../googlesitekit/datastore/user/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../datastore/constants';
import { getWidgetComponentProps } from '../../../../../googlesitekit/widgets/util';
import SearchFunnelWidgetGA4 from '.';

describe( 'SearchFunnelWidgetGA4', () => {
	let registry;

	const widgetComponentProps = getWidgetComponentProps( 'searchFunnel' );

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideSiteInfo( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetSettings( {
			propertyID: 'http://example.com/',
		} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );

		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
			),
			{
				body: [
					{
						clicks: 123,
						ctr: 4.56,
						impressions: 7890,
						keys: [ '2022-06-21' ],
						position: 12.345,
					},
				],
			}
		);

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/data-available'
			)
		);
	} );

	it( 'should render the Search Funnel Widget, including the Activate Analytics CTA', async () => {
		const { container, getByText, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( /Set up Google Analytics/ ) ).toBeInTheDocument();
	} );

	it( 'should not render the Activate Analytics CTA when the Analytics module is not available', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				coreModulesFixture.filter(
					( { slug } ) => slug !== 'analytics-4'
				)
			);

		const { container, queryByText, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( /Set up Google Analytics/ )
		).not.toBeInTheDocument();
	} );
} );
