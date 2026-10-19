/**
 * SeeAllRecentPostsLink component tests.
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
import { PERMISSION_READ_SHARED_MODULE_DATA } from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { BREAKPOINT_DESKTOP } from '@/js/hooks/useBreakpoint';
import {
	LATEST_CONTENT_COUNT,
	LATEST_CONTENT_TAB_ID,
} from '@/js/modules/analytics-4/components/module/ModulePopularPagesWidgetGA4/constants';
import {
	LATEST_POST,
	provideLatestContent,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { provideRecentContent } from '@/js/modules/analytics-4/datastore/test-utils';
import * as scrollUtils from '@/js/util/scroll';
import {
	createTestRegistry,
	fireEvent,
	render,
	screen,
	waitFor,
} from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import SeeAllRecentPostsLink from './SeeAllRecentPostsLink';

describe( 'SeeAllRecentPostsLink', () => {
	let registry: WPDataRegistry;

	const postsEndpoint = new RegExp( '^/wp/v2/posts' );

	const getNavigationalScrollTopSpy = jest.spyOn(
		scrollUtils,
		'getNavigationalScrollTop'
	);
	const scrollToSpy = jest.spyOn( global, 'scrollTo' );

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		getNavigationalScrollTopSpy.mockReturnValue( 100 );
		scrollToSpy.mockClear();
	} );

	afterEach( () => {
		global.history.replaceState( {}, '', '/' );
	} );

	it( 'should render the link when the site has two or more recent posts', () => {
		provideLatestContent( registry );

		render( <SeeAllRecentPostsLink />, { registry } );

		expect(
			screen.getByRole( 'button', { name: 'See all recent posts' } )
		).toBeInTheDocument();
	} );

	it.each( [
		[ 'one recent post', [ LATEST_POST ] ],
		[ 'no recent posts', [] ],
	] )(
		'should render nothing when the site has %s',
		( _description, recentContent ) => {
			provideRecentContent( registry, recentContent, {
				count: LATEST_CONTENT_COUNT,
			} );

			const { container } = render( <SeeAllRecentPostsLink />, {
				registry,
			} );

			expect( container ).toBeEmptyDOMElement();
		}
	);

	it( 'should render nothing while the recent posts are loading', async () => {
		freezeFetch( postsEndpoint );

		const { container } = render( <SeeAllRecentPostsLink />, {
			registry,
		} );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( postsEndpoint )
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing when the request for the recent posts fails', async () => {
		fetchMock.get( postsEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, waitForRegistry } = render(
			<SeeAllRecentPostsLink />,
			{ registry }
		);

		await waitForRegistry();

		expect( fetchMock ).toHaveFetched( postsEndpoint );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should render nothing, and should not request the recent posts, for a view-only user who cannot view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
		} );

		const { container, waitForRegistry } = render(
			<SeeAllRecentPostsLink />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( container ).toBeEmptyDOMElement();
		expect( fetchMock ).not.toHaveFetched( postsEndpoint );
	} );

	it( 'should select the Latest content tab, set the URL hash, and scroll to the content section when clicked', () => {
		provideLatestContent( registry );

		render( <SeeAllRecentPostsLink />, { registry } );

		fireEvent.click(
			screen.getByRole( 'button', { name: 'See all recent posts' } )
		);

		expect(
			registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
		).toBe( LATEST_CONTENT_TAB_ID );
		expect( global.location.hash ).toBe( '#content' );
		expect( getNavigationalScrollTopSpy ).toHaveBeenCalledWith(
			'#content',
			BREAKPOINT_DESKTOP
		);
		expect( scrollToSpy ).toHaveBeenCalledWith( {
			top: 100,
			behavior: 'smooth',
		} );
	} );
} );
