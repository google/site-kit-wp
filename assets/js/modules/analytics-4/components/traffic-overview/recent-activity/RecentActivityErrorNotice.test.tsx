/**
 * Recent activity error notice tests.
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
import {
	INSUFFICIENT_PERMISSIONS_ERROR,
	INTERNAL_SERVER_ERROR,
	RATE_LIMIT_ERROR,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import {
	createTestRegistry,
	fireEvent,
	render,
	screen,
} from '@tests/js/test-utils';
import { provideSiteInfo } from '@tests/js/utils';
import RecentActivityErrorNotice from './RecentActivityErrorNotice';

describe( 'RecentActivityErrorNotice', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
	} );

	it( 'should render "Something went wrong" over "We can’t access your traffic data. Try refreshing or get help"', () => {
		const { container } = render(
			<RecentActivityErrorNotice
				error={ INTERNAL_SERVER_ERROR }
				onRetry={ jest.fn() }
			/>,
			{ registry }
		);

		expect( container ).toHaveTextContent(
			'Something went wrongWe can’t access your traffic data. Try refreshing or get help'
		);
	} );

	it( 'should render a "Retry" button that calls `onRetry` for an internal server error', () => {
		const onRetry = jest.fn();

		render(
			<RecentActivityErrorNotice
				error={ INTERNAL_SERVER_ERROR }
				onRetry={ onRetry }
			/>,
			{ registry }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( onRetry ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not render a "Retry" button for a rate limit error', () => {
		render(
			<RecentActivityErrorNotice
				error={ RATE_LIMIT_ERROR }
				onRetry={ jest.fn() }
			/>,
			{ registry }
		);

		expect(
			screen.queryByRole( 'button', { name: 'Retry' } )
		).not.toBeInTheDocument();
	} );

	it( 'should not render a "Retry" button when no `onRetry` is passed', () => {
		render( <RecentActivityErrorNotice error={ INTERNAL_SERVER_ERROR } />, {
			registry,
		} );

		expect(
			screen.queryByRole( 'button', { name: 'Retry' } )
		).not.toBeInTheDocument();
	} );

	it( 'should link "get help" to the support page of the error', () => {
		render(
			<RecentActivityErrorNotice
				error={ INTERNAL_SERVER_ERROR }
				onRetry={ jest.fn() }
			/>,
			{ registry }
		);

		expect(
			screen.getByRole( 'link', { name: /get help/ } )
		).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?error_id=internal_server_error'
		);
	} );

	it( 'should render "get help" with no external link icon', () => {
		render(
			<RecentActivityErrorNotice
				error={ INTERNAL_SERVER_ERROR }
				onRetry={ jest.fn() }
			/>,
			{ registry }
		);

		// Jest renders every SVG import as an `svg` element, the external
		// link icon of `Link` among them.
		expect(
			screen
				.getByRole( 'link', { name: /get help/ } )
				.querySelector( 'svg' )
		).not.toBeInTheDocument();
	} );

	it( 'should link "get help" to the support page about the permissions Analytics needs, for a permissions error with no module named', () => {
		render(
			<RecentActivityErrorNotice
				error={ INSUFFICIENT_PERMISSIONS_ERROR }
			/>,
			{ registry }
		);

		expect(
			screen.getByRole( 'link', { name: /get help/ } )
		).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?error_id=analytics-4_insufficient_permissions'
		);
	} );

	it( 'should link "get help" to the support page about the permissions the module needs, for a permissions error', () => {
		render(
			<RecentActivityErrorNotice
				moduleSlug={ MODULE_SLUG_SEARCH_CONSOLE }
				error={ {
					code: 403,
					message:
						'User does not have sufficient permission for site.',
					data: { status: 403, reason: 'forbidden' },
				} }
				onRetry={ jest.fn() }
			/>,
			{ registry }
		);

		expect(
			screen.getByRole( 'link', { name: /get help/ } )
		).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?error_id=search-console_insufficient_permissions'
		);
	} );
} );
