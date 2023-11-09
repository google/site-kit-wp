/**
 * Footer tests.
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

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	provideModules,
	render,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../../../tests/js/test-utils';
import { MODULES_SEARCH_CONSOLE } from '../../../datastore/constants';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../googlesitekit/constants';
import Footer from './Footer';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import * as analytics4fixtures from '../../../../analytics-4/datastore/__fixtures__';

describe( 'Footer', () => {
	let registry;

	const metrics = [
		{
			id: 'impressions',
			color: '#4285f4',
			label: 'Impressions',
			metric: 'impressions',
			service: 'search-console',
		},
		{
			id: 'users',
			color: '#5c9271',
			label: 'Users',
			service: 'analytics-4',
		},
	];

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
	} );

	it( 'should not make a search console settings requests when the view context is "view only"', () => {
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetSettings( analytics4fixtures.defaultSettings );

		const { container } = render(
			<Footer metrics={ metrics } selectedStats={ 0 } />,
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				registry,
			}
		);

		expect( fetchMock ).not.toHaveFetched(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/settings'
			)
		);
		expect( container ).not.toHaveTextContent( 'Search Console' );
		expect( container.firstChild ).toBeNull();
		waitForDefaultTimeouts();
	} );

	it( 'should not make a analytics settings requests when the view context is "view only"', () => {
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetSettings( analytics4fixtures.defaultSettings );

		const { container } = render(
			<Footer metrics={ metrics } selectedStats={ 1 } />,
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				registry,
			}
		);

		expect( fetchMock ).not.toHaveFetched(
			new RegExp( '^/google-site-kit/v1/modules/analytics/data/settings' )
		);
		expect( container ).not.toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).toBeNull();
	} );

	it( 'should make a search console settings request normally when the view context is NOT "view only"', async () => {
		const searchConsoleRegExp = new RegExp(
			'^/google-site-kit/v1/modules/search-console/data/settings'
		);
		fetchMock.getOnce( searchConsoleRegExp, { body: {}, status: 200 } );

		const { container } = render(
			<Footer metrics={ metrics } selectedStats={ 0 } />,
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				registry,
			}
		);

		await untilResolved( registry, MODULES_SEARCH_CONSOLE ).getSettings();

		expect( fetchMock ).toHaveFetched( searchConsoleRegExp );
		expect( container ).toHaveTextContent( 'Search Console' );
		expect( container.firstChild ).not.toBeNull();
	} );

	it( 'should make a analytics settings request normally when the view context is NOT "view only"', async () => {
		const analyticsSettingsRegExp = new RegExp(
			'^/google-site-kit/v1/modules/analytics/data/settings'
		);
		fetchMock.getOnce( analyticsSettingsRegExp, { body: {}, status: 200 } );

		const { container } = render(
			<Footer metrics={ metrics } selectedStats={ 1 } />,
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				registry,
			}
		);

		// Wait for resolvers to run.
		await waitForDefaultTimeouts();

		expect( fetchMock ).toHaveFetched( analyticsSettingsRegExp );
		expect( container ).toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).not.toBeNull();
	} );
} );
