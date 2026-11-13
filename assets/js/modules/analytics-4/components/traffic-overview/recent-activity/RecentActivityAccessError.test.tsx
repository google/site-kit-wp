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
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, render, screen } from '@tests/js/test-utils';
import { provideSiteInfo, provideUserInfo } from '@tests/js/utils';
import RecentActivityAccessError from './RecentActivityAccessError';

describe( 'RecentActivityAccessError', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	it( 'should render "No recent activity data found" as a heading, over "We can’t access your traffic data." and "Request access or get help"', () => {
		const { container } = render( <RecentActivityAccessError />, {
			registry,
		} );

		expect(
			screen.getByRole( 'heading', {
				name: 'No recent activity data found',
			} )
		).toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'We can’t access your traffic data. Request access or get help'
		);
		expect( container ).not.toHaveTextContent( 'Try refreshing' );
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

	it( 'should link "Request access" to the Analytics web data stream, in a new tab and with no external link icon', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			accountID: '12345',
			propertyID: '34567',
			webDataStreamID: '78901',
		} );

		render( <RecentActivityAccessError />, { registry } );

		const link = screen.getByRole( 'link', { name: /Request access/ } );

		expect( link ).toHaveAttribute(
			'href',
			'https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fanalytics%2Fweb%2F%23%2Fa12345p34567%2Fadmin%2Fstreams%2Ftable%2F78901%3Futm_source%3Dsitekit&Email=wapuu.wordpress%40gmail.com&utm_source=sitekit'
		);
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( link.querySelector( 'svg' ) ).not.toBeInTheDocument();
	} );

	it( 'should render "Request access" as plain text when the Analytics settings give no access URL', () => {
		render( <RecentActivityAccessError />, { registry } );

		expect( screen.getByText( 'Request access' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /Request access/ } )
		).not.toBeInTheDocument();
	} );

	it( 'should render "Request access" as plain text on a view-only dashboard, even when the Analytics settings give an access URL', () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			accountID: '12345',
			propertyID: '34567',
			webDataStreamID: '78901',
		} );

		render( <RecentActivityAccessError />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( screen.getByText( 'Request access' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'link', { name: /Request access/ } )
		).not.toBeInTheDocument();
	} );
} );
