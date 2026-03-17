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
	provideUserCapabilities,
	fireEvent,
	waitFor,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import * as tracking from '@/js/util/tracking';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { useWelcomeTour } from '@/js/feature-tours/hooks/useWelcomeTour';
import { getWelcomeTour } from '@/js/feature-tours/welcome';
import HelpMenu from './HelpMenu';

jest.mock( '@/js/feature-tours/hooks/useWelcomeTour' );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const mockWelcomeTour = getWelcomeTour( {
	isViewOnly: false,
	canAuthenticate: true,
	isAnalyticsConnected: false,
	isActivateAnalyticsNotificationPresent: false,
} );

describe( 'HelpMenu', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry );
		provideUserCapabilities( registry );

		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		jest.mocked( useWelcomeTour ).mockReturnValue( mockWelcomeTour );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'with the `setupFlowRefresh` feature flag enabled', () => {
		it( 'should render the correct menu items', () => {
			const { container } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render the "Get help with AdSense" menu item when AdSense is active', () => {
			provideModules( registry, [ { slug: 'adsense', active: true } ] );

			const { container, getByText } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			expect( container ).toMatchSnapshot();
			expect( getByText( 'Get help with AdSense' ) ).toBeInTheDocument();
		} );

		it( 'should track the `open_helpmenu` event when the help menu is opened', () => {
			const { getByRole } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			fireEvent.click( getByRole( 'button', { name: 'Help' } ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar`,
				'open_helpmenu'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		} );

		it.each( [
			[ 'Browse documentation', 'browse_documentation' ],
			[ 'Get free support', 'get_support' ],
			[ 'Start a feature tour', 'start_tour' ],
			[ 'Send feedback', 'send_feedback' ],
		] )(
			'should track the `click_menu_item` event when clicking the "%s" button, with the label set to `%s`',
			( linkText, expectedLabel ) => {
				const { getByText } = render( <HelpMenu />, {
					registry,
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					features: [ 'setupFlowRefresh' ],
				} );

				fireEvent.click( getByText( linkText ) );

				expect( mockTrackEvent ).toHaveBeenCalledWith(
					`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar_helpmenu`,
					'click_menu_item',
					expectedLabel
				);
				expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			}
		);

		it( 'should track the `click_menu_item` event for the "Get help with AdSense" menu item when AdSense is active', () => {
			provideModules( registry, [ { slug: 'adsense', active: true } ] );

			const { getByText } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			fireEvent.click( getByText( 'Get help with AdSense' ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar_helpmenu`,
				'click_menu_item',
				'get_adsense_help'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should trigger the dashboard tour when the "Start a feature tour" button is clicked', async () => {
			const { getByText, waitForRegistry } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				features: [ 'setupFlowRefresh' ],
			} );

			await waitForRegistry();

			fireEvent.click( getByText( 'Start a feature tour' ) );

			await waitFor( () => {
				expect( registry.select( CORE_USER ).getCurrentTour() ).toEqual(
					mockWelcomeTour
				);
			} );
		} );
	} );

	describe( 'without the `setupFlowRefresh` feature flag', () => {
		it( 'should track the `click_outgoing_link` event for legacy menu items', () => {
			const { getByText } = render( <HelpMenu />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			fireEvent.click( getByText( 'Read help docs' ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_headerbar_helpmenu`,
				'click_outgoing_link',
				'documentation'
			);
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
