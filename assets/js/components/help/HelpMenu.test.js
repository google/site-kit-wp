/**
 * HelpMenu component tests.
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
import {
	render,
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	fireEvent,
	act,
} from '../../../../tests/js/test-utils';
import * as tracking from '@/js/util/tracking';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import HelpMenu from './HelpMenu';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'HelpMenu', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'with `setupFlowRefresh` feature flag enabled', () => {
		it( 'should render the `setupFlowRefresh` menu items', () => {
			const { getByText, getByRole } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			fireEvent.click( getByRole( 'button', { name: 'Help' } ) );

			expect( getByText( 'Browse documentation' ) ).toBeInTheDocument();
			expect( getByText( 'Get free support' ) ).toBeInTheDocument();
			expect( getByText( 'Start a feature tour' ) ).toBeInTheDocument();
			expect( getByText( 'Send feedback' ) ).toBeInTheDocument();
		} );

		it.each( [
			[ 'Browse documentation', 'browse_documentation' ],
			[ 'Get free support', 'get_support' ],
			[ 'Start a feature tour', 'start_tour' ],
			[ 'Send feedback', 'send_feedback' ],
		] )(
			'should track `click_menu_item` event when clicking "%s" with label "%s"',
			async ( linkText, expectedLabel ) => {
				const { getByText, getByRole } = render( <HelpMenu />, {
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					features: [ 'setupFlowRefresh' ],
				} );

				fireEvent.click( getByRole( 'button', { name: 'Help' } ) );

				// eslint-disable-next-line require-await
				await act( async () => {
					fireEvent.click( getByText( linkText ) );
				} );

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar_helpmenu`,
					'click_menu_item',
					expectedLabel
				);
			}
		);

		it( 'should show and track `click_menu_item` event for "Get help with AdSense" when AdSense is active', async () => {
			provideModules( registry, [ { slug: 'adsense', active: true } ] );

			const { getByText, getByRole } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			fireEvent.click( getByRole( 'button', { name: 'Help' } ) );

			expect( getByText( 'Get help with AdSense' ) ).toBeInTheDocument();

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByText( 'Get help with AdSense' ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar_helpmenu`,
				'click_menu_item',
				'get_adsense_help'
			);
		} );

		it( 'should not show "Get help with AdSense" when AdSense is not active', () => {
			provideModules( registry, [ { slug: 'adsense', active: false } ] );

			const { queryByText, getByRole } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			fireEvent.click( getByRole( 'button', { name: 'Help' } ) );

			expect(
				queryByText( 'Get help with AdSense' )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'without `setupFlowRefresh` feature flag', () => {
		it( 'should track `click_outgoing_link` event for legacy menu items', async () => {
			const { getByText, getByRole } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			fireEvent.click( getByRole( 'button', { name: 'Help' } ) );

			// eslint-disable-next-line require-await
			await act( async () => {
				fireEvent.click( getByText( 'Read help docs' ) );
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar_helpmenu`,
				'click_outgoing_link',
				'documentation'
			);
		} );
	} );
} );
