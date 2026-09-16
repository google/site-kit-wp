/**
 * Feature Discovery routed content tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { render } from '@tests/js/test-utils';
import FeatureDiscoveryContent from './FeatureDiscoveryContent';

describe( 'FeatureDiscoveryContent', () => {
	it( 'should render only the tab panel content for /all-services', () => {
		const { getByText, queryByText } = render(
			<FeatureDiscoveryContent />,
			{
				route: '/all-services',
			}
		);

		expect(
			getByText(
				'Feature Discovery Hub tab panel placeholder: All services and features'
			)
		).toBeInTheDocument();

		expect(
			queryByText(
				'Feature Discovery Hub tab panel placeholder: What’s new?'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should render only the tab panel content for /whats-new', () => {
		const { getByText, queryByText } = render(
			<FeatureDiscoveryContent />,
			{
				route: '/whats-new',
			}
		);

		expect(
			getByText(
				'Feature Discovery Hub tab panel placeholder: What’s new?'
			)
		).toBeInTheDocument();

		expect(
			queryByText(
				'Feature Discovery Hub tab panel placeholder: All services and features'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should redirect base path to /whats-new', () => {
		const { getByText, history } = render( <FeatureDiscoveryContent />, {
			route: '/',
		} );

		expect( history.location.pathname ).toBe( '/whats-new' );
		expect( history.action ).toBe( 'REPLACE' );

		expect(
			getByText(
				'Feature Discovery Hub tab panel placeholder: What’s new?'
			)
		).toBeInTheDocument();
	} );

	it( 'should redirect unknown paths to /whats-new', () => {
		const { getByText, history } = render( <FeatureDiscoveryContent />, {
			route: '/unknown',
		} );

		expect( history.location.pathname ).toBe( '/whats-new' );
		expect( history.action ).toBe( 'REPLACE' );

		expect(
			getByText(
				'Feature Discovery Hub tab panel placeholder: What’s new?'
			)
		).toBeInTheDocument();
	} );
} );
