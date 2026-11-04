/**
 * Recent activity access error tests.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { createTestRegistry, render, screen } from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import RecentActivityAccessError from './RecentActivityAccessError';

describe( 'RecentActivityAccessError', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'should render "No recent activity data found" as a heading, over "We can’t access your traffic data." and "Try refreshing or get help"', () => {
		const { container } = render( <RecentActivityAccessError />, {
			registry,
		} );

		expect(
			screen.getByRole( 'heading', {
				name: 'No recent activity data found',
			} )
		).toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'We can’t access your traffic data. Try refreshing or get help'
		);
	} );

	it( 'should render an illustration', () => {
		const { container } = render( <RecentActivityAccessError />, {
			registry,
		} );

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__recent-activity-message-illustration svg'
			)
		).toBeInTheDocument();
	} );

	it( 'should render "get help" with no external link icon', () => {
		render( <RecentActivityAccessError />, { registry } );

		// Jest renders every SVG import as an `svg` element, the external
		// link icon of `Link` among them.
		expect(
			screen
				.getByRole( 'link', { name: /get help/ } )
				.querySelector( 'svg' )
		).not.toBeInTheDocument();
	} );

	it( 'should link "get help" to the support page about the permissions Analytics needs, in a new tab', () => {
		render( <RecentActivityAccessError />, { registry } );

		const link = screen.getByRole( 'link', { name: /get help/ } );

		expect( link ).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?error_id=analytics-4_insufficient_permissions'
		);
		expect( link ).toHaveAttribute( 'target', '_blank' );
	} );
} );
