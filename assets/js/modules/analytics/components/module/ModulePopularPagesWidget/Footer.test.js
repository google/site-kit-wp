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
import { act, render } from '../../../../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../../../../../googlesitekit/constants';
import Footer from './Footer';

describe( 'Footer', () => {
	beforeEach( () => {
		jest.useFakeTimers();
		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics/data/settings'
			),
			{ body: {}, status: 200 }
		);
		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
			{
				body: [
					{
						slug: 'analytics-4',
						name: 'Analytics-4',
						active: true,
						connected: true,
					},
				],
			}
		);
	} );

	it( 'should not make a analytics settings requests when the view context is "view only"', () => {
		const { container } = render( <Footer />, {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		act( () => {
			jest.runAllTimers();
		} );

		expect( fetchMock ).not.toHaveFetched(
			new RegExp( '^/google-site-kit/v1/modules/analytics/data/settings' )
		);
		expect( container ).not.toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).toBeNull();
	} );

	it( 'should make a analytics settings request normally when the view context is NOT "view only"', () => {
		const { container } = render( <Footer />, {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		act( () => {
			jest.runAllTimers();
		} );

		expect( fetchMock ).toHaveFetched(
			new RegExp( '^/google-site-kit/v1/modules/analytics/data/settings' )
		);
		expect( container ).toHaveTextContent( 'Analytics' );
		expect( container.firstChild ).not.toBeNull();
	} );
} );
