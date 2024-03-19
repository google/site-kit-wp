/**
 * AdminBarWidgets component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
	muteFetch,
	provideUserAuthentication,
} from '../../../../tests/js/test-utils';
import coreModulesFixture from '../../googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY } from '../../googlesitekit/constants';
import AdminBarWidgets from './AdminBarWidgets';

describe( 'AdminBarWidgets', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserCapabilities( registry );

		registry.dispatch( CORE_USER ).receiveGetAuthentication( {
			authenticated: true,
			needsReauthentication: false,
		} );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			adminURL: 'http://example.com/wp-admin/',
		} );

		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
			),
			{
				body: [
					{
						clicks: 123,
						ctr: 8.91,
						impressions: 4567,
						position: 23.456,
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

	it( 'should render the Admin Bar Widgets, including the Activate Analytics CTA', async () => {
		const { container, getByText, waitForRegistry } = render(
			<AdminBarWidgets />,
			{
				registry,
			}
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
			<AdminBarWidgets />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( /Set up Google Analytics/ )
		).not.toBeInTheDocument();
	} );

	it( 'should render the Admin Bar Widgets for the view only user if the module is shared', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		provideUserCapabilities( registry, {
			'googlesitekit_read_shared_module_data::["search-console"]': true,
		} );

		const { getByText, queryByText, waitForRegistry } = render(
			<AdminBarWidgets />,
			{
				registry,
				viewContext: VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
			}
		);

		await waitForRegistry();

		// Verify that the Search Console widgets are rendered.
		expect( getByText( /total impressions/i ) ).toBeInTheDocument();
		expect( getByText( /total clicks/i ) ).toBeInTheDocument();

		// Verify that the Analytics widgets are not rendered.
		expect( queryByText( /total users/i ) ).not.toBeInTheDocument();
		expect( queryByText( /total sessions/i ) ).not.toBeInTheDocument();
	} );

	it( 'should not render the Admin Bar Widgets for the view only user if the module is not shared', async () => {
		provideUserAuthentication( registry, { authenticated: false } );

		const { queryByText, waitForRegistry } = render( <AdminBarWidgets />, {
			registry,
			viewContext: VIEW_CONTEXT_ADMIN_BAR_VIEW_ONLY,
		} );

		await waitForRegistry();

		expect( queryByText( /total impressions/i ) ).not.toBeInTheDocument();
	} );
} );
