/**
 * IntroModal component tests.
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	ACTIVE_CONTEXT_ID,
	CORE_UI,
	FORCED_IN_VIEW_WIDGET_AREAS,
} from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import {
	SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS,
	getSiteGoalsTour,
} from '@/js/modules/analytics-4/components/site-goals/feature-tours/site-goals';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import * as scrollUtils from '@/js/util/scroll';
import { dismissItemEndpoint } from '@tests/js/mock-dismiss-item-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import IntroModal from './index';

jest.mock( '@/js/googlesitekit/notifications/hooks/useNotificationEvents' );

const getNavigationalScrollTopSpy = jest.spyOn(
	scrollUtils,
	'getNavigationalScrollTop'
);
const scrollToSpy = jest.spyOn( global, 'scrollTo' );

/**
 * Adds the tour's first step target to the page, so `checkRequirements`
 * resolves right away. The `afterEach` below removes it.
 *
 * @since n.e.x.t
 */
function appendTourTarget() {
	const target = document.createElement( 'div' );
	target.className = 'googlesitekit-site-goals-primary-action';
	document.body.appendChild( target );
}

/**
 * Waits until the intro modal renders its "Show me" button.
 *
 * @since n.e.x.t
 *
 * @param {Function} getByRole The `getByRole` query from the render result.
 */
async function waitForIntroModalToShow( getByRole ) {
	await waitFor( () => {
		expect(
			getByRole( 'button', { name: /show me/i } )
		).toBeInTheDocument();
	} );
}

describe( 'IntroModal', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		fetchMock.post( dismissItemEndpoint, {
			body: { success: true },
			status: 200,
		} );

		useNotificationEvents.mockReturnValue( {
			view: jest.fn(),
			confirm: jest.fn(),
			clickLearnMore: jest.fn(),
			dismiss: jest.fn(),
		} );

		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		] );
		provideUserAuthentication( registry );
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: true },
				{ slug: MODULE_SLUG_ANALYTICS_4 }
			);
		// Breakdown notice gating: dimensions not yet created so the tour
		// includes the breakdown step.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { availableCustomDimensions: [] } );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
	} );

	afterEach( () => {
		document
			.querySelectorAll( '.googlesitekit-site-goals-primary-action' )
			.forEach( ( target ) => target.remove() );
		global.location.hash = '';
		getNavigationalScrollTopSpy.mockClear();
		scrollToSpy.mockClear();
	} );

	it( 'renders ecommerce-only variant when only ecommerce conversion events exist', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		appendTourTarget();

		const { container, getByRole } = render( <IntroModal />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders lead-only variant when only lead conversion events exist', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );
		appendTourTarget();

		const { container, getByRole } = render( <IntroModal />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders ecommerce-and-lead variant when both conversion event types exist', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );
		appendTourTarget();

		const { container, getByRole } = render( <IntroModal />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );

		expect( container ).toMatchSnapshot();
	} );

	it( 'renders nothing while the Site Goals section is missing', () => {
		jest.useFakeTimers();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const { container } = render( <IntroModal />, {
			registry,
		} );

		// Two checks go by with no target on the page. The modal must keep
		// waiting.
		act( () => {
			jest.advanceTimersByTime( 500 );
		} );

		expect( container ).toBeEmptyDOMElement();

		jest.useRealTimers();
	} );

	it( 'renders modal after the wait limit when the section never appears', async () => {
		jest.useFakeTimers();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const { getByRole } = render( <IntroModal />, {
			registry,
		} );

		// Run all 120 ticks of 250ms each. That is the full 30-second
		// wait. The async act lets each check finish before the next timer
		// runs.
		for ( let check = 0; check < 120; check++ ) {
			// eslint-disable-next-line require-await
			await act( async () => {
				jest.advanceTimersByTime( 250 );
			} );
		}

		expect(
			getByRole( 'button', { name: /show me/i } )
		).toBeInTheDocument();

		jest.useRealTimers();
	} );

	it( 'sets the widget areas to load while waiting, then clears them when the modal is dismissed', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		appendTourTarget();

		const { getByRole } = render( <IntroModal />, {
			registry,
		} );

		// While the modal waits, it sets the widget areas to load.
		expect(
			registry.select( CORE_UI ).getValue( FORCED_IN_VIEW_WIDGET_AREAS )
		).toEqual( SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS );

		await waitForIntroModalToShow( getByRole );

		// The dismissal also saves the dismissed item. The async act call
		// lets that request finish inside the test.
		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /maybe later/i } ) );
		} );

		expect(
			registry.select( CORE_UI ).getValue( FORCED_IN_VIEW_WIDGET_AREAS )
		).toBeUndefined();
	} );

	it( 'should start the Site Goals tour when the user clicks "Show me"', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		appendTourTarget();

		const { getByRole } = render( <IntroModal />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );

		fireEvent.click( getByRole( 'button', { name: /show me/i } ) );

		// The tour waits for the section again before it starts.
		await waitFor( () => {
			expect( registry.select( CORE_USER ).getCurrentTour() ).toEqual(
				getSiteGoalsTour( {
					isEcommerceOnly: true,
					hasBreakdownNotice: true,
				} )
			);
		} );

		// The modal clears the widget areas to load when it closes. The tour
		// then sets the same list itself.
		expect(
			registry.select( CORE_UI ).getValue( FORCED_IN_VIEW_WIDGET_AREAS )
		).toEqual( SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS );
	} );

	it( 'should navigate to the Site Goals section when the user clicks "Show me"', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		appendTourTarget();

		// Return a known position only for the Site Goals anchor, so the
		// scroll assertion below also checks the selector.
		getNavigationalScrollTopSpy.mockImplementation( ( selector ) => {
			if ( selector === '#site-goals' ) {
				return 12345;
			}

			return 0;
		} );

		const { getByRole } = render( <IntroModal />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );

		// The click also dismisses the modal and starts the tour. The async
		// act call lets those updates finish inside the test. The callback
		// itself has nothing to await.
		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /show me/i } ) );
		} );

		// The click sets the URL hash, sets the active context, and scrolls
		// to the section anchor, the same actions the navigation chip
		// performs.
		expect( global.location.hash ).toBe( '#site-goals' );
		expect( registry.select( CORE_UI ).getValue( ACTIVE_CONTEXT_ID ) ).toBe(
			'site-goals'
		);
		expect( scrollToSpy ).toHaveBeenCalledWith( {
			top: 12345,
			behavior: 'smooth',
		} );
	} );

	it( 'does not render for an authenticated user without access to Analytics', () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: MODULE_SLUG_ANALYTICS_4 }
			);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const { container } = render( <IntroModal />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'still renders for a view-only user with detected events', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		appendTourTarget();

		const { getByRole } = render( <IntroModal />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );
	} );
} );
