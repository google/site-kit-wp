/**
 * WPDashboardWidgets component tests.
 */

import { useIntersection as mockUseIntersection } from 'react-use';

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
import coreModulesFixture from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import WPDashboardWidgets from './WPDashboardWidgets';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'WPDashboardWidgets', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserCapabilities( registry );
		provideUserAuthentication( registry );
		provideSiteInfo( registry );

		registry.dispatch( CORE_MODULES ).receiveGetModules(
			coreModulesFixture.map( ( m ) => {
				if ( m.slug === MODULE_SLUG_ANALYTICS_4 ) {
					return { ...m, active: false, connected: false };
				}
				return m;
			} )
		);

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

	describe( 'GA Event Tracking with SetupFlowRefresh Enabled', () => {
		beforeEach( () => {
			mockUseIntersection.mockImplementation( () => ( {
				isIntersecting: true,
				intersectionRatio: 1,
			} ) );
		} );

		it( 'should track view event when Activate Analytics CTA is rendered', async () => {
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
			const { getByText, waitForRegistry } = render(
				<WPDashboardWidgets />,
				{
					registry,
					features: [ 'setupFlowRefresh' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			fireEvent.click( getByText( /Maybe later/ ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'dismiss_cta',
				'wp_dashboard'
			);
		} );

		it( 'should track confirm event when Activate Analytics CTA is clicked', async () => {
			const { getByText, waitForRegistry } = render(
				<WPDashboardWidgets />,
				{
					registry,
					features: [ 'setupFlowRefresh' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			fireEvent.click( getByText( /Set up Analytics/ ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'confirm_cta',
				'wp_dashboard'
			);
		} );

		it( 'should track clickLearnMore event when Learn more link is clicked in Activate Analytics CTA banner', async () => {
			const { getByText, waitForRegistry } = render(
				<WPDashboardWidgets />,
				{
					registry,
					features: [ 'setupFlowRefresh' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			fireEvent.click( getByText( /Learn more/ ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'click_learn_more_link',
				'wp_dashboard'
			);
		} );
	} );
} );
