/**
 * Footer tests.
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

/**
 * Internal dependencies
 */
import {
	act,
	createTestRegistry,
	provideModules,
	render,
	unsubscribeFromAll,
} from '../../../../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../googlesitekit/constants';
import Footer from './Footer';
import * as analytics4fixtures from '../../../datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';

describe( 'Footer', () => {
	let registry;
	beforeEach( () => {
		jest.useFakeTimers();

		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'analytics-4',
				name: 'Analytics-4',
				active: true,
				connected: true,
			},
		] );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should not make a analytics settings requests when the view context is "view only"', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( analytics4fixtures.defaultSettings );

		const { container } = render( <Footer />, {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			registry,
		} );

		act( () => {
			jest.runAllTimers();
		} );

		expect( fetchMock ).not.toHaveFetched(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/settings'
			)
		);
		expect( container ).not.toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).toBeNull();
	} );

	it( 'should make a analytics settings request normally when the view context is NOT "view only"', () => {
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/settings'
			),
			{ body: {}, status: 200 }
		);

		const { container } = render( <Footer />, {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			registry,
		} );

		act( () => {
			jest.runAllTimers();
		} );

		expect( fetchMock ).toHaveFetched(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/settings'
			)
		);
		expect( container ).toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).not.toBeNull();
	} );
} );
