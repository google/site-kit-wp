/**
 * WPDashboardWidgets component tests.
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
 * External dependencies
 */
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	provideModules,
	provideUserCapabilities,
	provideUserAuthentication,
	provideSiteInfo,
	muteFetch,
	fireEvent,
} from '../../../../tests/js/test-utils';
import * as tracking from '@/js/util/tracking';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import WPDashboardWidgets from './WPDashboardWidgets';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';

jest.mock( 'react-use', () => ( {
	...( jest.requireActual( 'react-use' ) as Record< string, unknown > ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'WPDashboardWidgets', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserCapabilities( registry );
		provideUserAuthentication( registry );
		provideSiteInfo( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			adminURL: 'http://example.com/wp-admin/',
		} );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/data-available'
			)
		);
	} );

	afterEach( () => {
		jest.resetAllMocks();
	} );

	it( 'should track the `view_cta` event when the Activate Analytics CTA is viewed', async () => {
		( mockUseIntersection as unknown as jest.Mock ).mockImplementation(
			() => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} )
		);

		const { waitForRegistry } = render( <WPDashboardWidgets />, {
			registry,
			features: [ 'setupFlowRefresh' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
			'view_cta',
			'wp_dashboard'
		);
	} );

	it( 'should track dismiss event when Activate Analytics CTA banner is dismissed', async () => {
		const { getByRole, waitForRegistry } = render( <WPDashboardWidgets />, {
			registry,
			features: [ 'setupFlowRefresh' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /Maybe later/i } ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
			'dismiss_cta',
			'wp_dashboard'
		);
	} );

	it( 'should track confirm event when Activate Analytics CTA is clicked', async () => {
		const { getByRole, waitForRegistry } = render( <WPDashboardWidgets />, {
			registry,
			features: [ 'setupFlowRefresh' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: /Set up Analytics/i } ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
			'confirm_cta',
			'wp_dashboard'
		);
	} );

	it( 'should track clickLearnMore event when Learn more link is clicked in Activate Analytics CTA banner', async () => {
		const { getByRole, waitForRegistry } = render( <WPDashboardWidgets />, {
			registry,
			features: [ 'setupFlowRefresh' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		fireEvent.click( getByRole( 'link', { name: /Learn more/i } ) );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
			'click_learn_more_link',
			'wp_dashboard'
		);
	} );
} );
