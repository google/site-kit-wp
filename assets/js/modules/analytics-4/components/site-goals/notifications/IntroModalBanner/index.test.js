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
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import {
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_NOTICE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import {
	SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS,
	getSiteGoalsTour,
} from '@/js/modules/analytics-4/components/site-goals/feature-tours/site-goals';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { ANALYTICS_4_NOTIFICATIONS } from '@/js/modules/analytics-4/notifications';
import * as scrollUtils from '@/js/util/scroll';
import { dismissItemEndpoint } from '@tests/js/mock-dismiss-item-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
	waitFor,
} from '@tests/js/test-utils';
import IntroModal, {
	INTRO_MODAL_VARIANTS,
	SITE_GOALS_INTRO_MODAL_BANNER,
	SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED,
} from './index';

jest.mock( '@/js/googlesitekit/notifications/hooks/useNotificationEvents' );

const IntroModalComponent = withNotificationComponentProps(
	SITE_GOALS_INTRO_MODAL_BANNER
)( IntroModal );

/**
 * The modal content renders inside a fixed-position Dialog, so the
 * `<Notification>` wrapper's own observer never sees it. `BannerModal` observes
 * its own graphic with `withIntersectionObserver`, which uses the native
 * `IntersectionObserver`. jsdom has none, so this stub reports the element as
 * in view the moment it is observed, which fires the modal's `onView` and makes
 * `<Notification>` send the `view_notification` event.
 *
 * @since n.e.x.t
 */
class InViewIntersectionObserver {
	constructor( callback ) {
		this.callback = callback;
	}

	observe( element ) {
		this.callback(
			[ { isIntersecting: true, intersectionRatio: 1, target: element } ],
			this
		);
	}

	unobserve() {}

	disconnect() {}
}

const getNavigationalScrollTopSpy = jest.spyOn(
	scrollUtils,
	'getNavigationalScrollTop'
);
const scrollToSpy = jest.spyOn( global, 'scrollTo' );

/**
 * Adds the tour's first step target to the page, so `checkRequirements`
 * resolves right away. The `afterEach` below removes it.
 *
 * @since 1.182.0
 */
function appendTourTarget() {
	const target = document.createElement( 'div' );
	target.className = 'googlesitekit-site-goals-primary-action';
	document.body.appendChild( target );
}

/**
 * Waits until the intro modal renders its "Show me" button.
 *
 * @since 1.182.0
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
	let trackEvents;

	beforeEach( () => {
		registry = createTestRegistry();

		fetchMock.post( dismissItemEndpoint, {
			body: { success: true },
			status: 200,
		} );

		trackEvents = {
			view: jest.fn(),
			confirm: jest.fn(),
			clickLearnMore: jest.fn(),
			dismiss: jest.fn(),
		};
		useNotificationEvents.mockReturnValue( trackEvents );

		provideSiteInfo( registry );
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
		// Both widgets on the dashboard, so each one can show the notice.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSiteGoalsSettings( {
			activeWidgets: [ GOAL_TYPES.ECOMMERCE, GOAL_TYPES.LEAD ],
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );

		// Register the notification so the Notifications API's
		// `dismissNotification` action (dispatched when the modal closes) can
		// find it and persist its dismissal.
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				SITE_GOALS_INTRO_MODAL_BANNER,
				ANALYTICS_4_NOTIFICATIONS[ SITE_GOALS_INTRO_MODAL_BANNER ]
			);
	} );

	afterEach( () => {
		document
			.querySelectorAll( '.googlesitekit-site-goals-primary-action' )
			.forEach( ( target ) => target.remove() );
		global.location.hash = '';
		getNavigationalScrollTopSpy.mockClear();
		scrollToSpy.mockClear();
	} );

	/**
	 * Renders the modal, confirms it, and returns the tour that starts.
	 *
	 * The Notifications API unmounts the modal once it leaves the notification
	 * queue, so this helper unmounts it too. The tour runs in the store and
	 * keeps going after the modal unmounts.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Promise<Object>} The tour the modal started.
	 */
	async function confirmModalAndGetTour() {
		appendTourTarget();

		const { getByRole, unmount } = render( <IntroModalComponent />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );

		// The async act call lets the dismissal requests finish inside the test.
		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /show me/i } ) );
		} );

		unmount();

		await waitFor( () => {
			expect(
				registry.select( CORE_USER ).getCurrentTour()
			).not.toBeUndefined();
		} );

		return registry.select( CORE_USER ).getCurrentTour();
	}

	it( 'renders ecommerce-only variant when only ecommerce conversion events exist', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		appendTourTarget();

		const { container, getByRole } = render( <IntroModalComponent />, {
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

		const { container, getByRole } = render( <IntroModalComponent />, {
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

		const { container, getByRole } = render( <IntroModalComponent />, {
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

		const { container } = render( <IntroModalComponent />, {
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

		const { getByRole } = render( <IntroModalComponent />, {
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

	it( 'sets the widget areas to load while waiting, then clears them when the modal unmounts', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		appendTourTarget();

		const { getByRole, unmount } = render( <IntroModalComponent />, {
			registry,
		} );

		// While the modal waits, it sets the widget areas to load.
		expect(
			registry.select( CORE_UI ).getValue( FORCED_IN_VIEW_WIDGET_AREAS )
		).toEqual( SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS );

		await waitForIntroModalToShow( getByRole );

		// Dismissing removes the modal from the notification queue, which
		// saves the dismissed item. The async act call lets that request
		// finish inside the test.
		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /maybe later/i } ) );
		} );

		// The dismissal persists the shared slug via `dismissNotification`.
		expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
			body: {
				data: {
					slug: SITE_GOALS_INTRO_MODAL_BANNER,
					expiration: 0,
				},
			},
		} );

		// The Notifications API unmounts the dismissed notification. Unmounting
		// runs the section-ready hook's cleanup, which clears the widget areas.
		unmount();

		expect(
			registry.select( CORE_UI ).getValue( FORCED_IN_VIEW_WIDGET_AREAS )
		).toBeUndefined();
	} );

	it( 'should start the Site Goals tour when the user clicks "Show me"', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const tour = await confirmModalAndGetTour();

		expect( tour ).toEqual(
			getSiteGoalsTour( {
				hasEcommerceBreakdownNotice: true,
				hasLeadBreakdownNotice: true,
			} )
		);

		// The modal clears its list of widget areas to load when it closes. The
		// tour then sets the same list itself.
		expect(
			registry.select( CORE_UI ).getValue( FORCED_IN_VIEW_WIDGET_AREAS )
		).toEqual( SITE_GOALS_TOUR_PRELOAD_WIDGET_AREAS );
	} );

	describe( 'the breakdown step the tour shows', () => {
		beforeEach( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setDetectedEvents( [
					ENUM_CONVERSION_EVENTS.PURCHASE,
					ENUM_CONVERSION_EVENTS.CONTACT,
				] );
		} );

		it( 'should ask about forms when the Online store widget is switched off', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetSiteGoalsSettings( {
					activeWidgets: [ GOAL_TYPES.LEAD ],
				} );

			const tour = await confirmModalAndGetTour();

			expect( tour ).toEqual(
				getSiteGoalsTour( {
					hasEcommerceBreakdownNotice: false,
					hasLeadBreakdownNotice: true,
				} )
			);
		} );

		it( 'should ask about plugins when only the Lead generation widget has its breakdown enabled', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				availableCustomDimensions: [
					SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[
						GOAL_TYPES.LEAD
					],
				],
			} );

			const tour = await confirmModalAndGetTour();

			expect( tour ).toEqual(
				getSiteGoalsTour( {
					hasEcommerceBreakdownNotice: true,
					hasLeadBreakdownNotice: false,
				} )
			);
		} );

		it( 'should drop the breakdown step once the user dismisses the notice', async () => {
			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [ SITE_GOALS_BREAKDOWN_NOTICE ] );

			const tour = await confirmModalAndGetTour();

			expect( tour ).toEqual(
				getSiteGoalsTour( {
					hasEcommerceBreakdownNotice: false,
					hasLeadBreakdownNotice: false,
				} )
			);
			expect( tour.steps ).toHaveLength( 2 );
		} );
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

		const { getByRole } = render( <IntroModalComponent />, {
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

	it( 'saves the confirmed dismissal item before the shared dismissal item when the user clicks "Show me"', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		appendTourTarget();

		const { getByRole } = render( <IntroModalComponent />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );

		// The click also dismisses the modal and starts the tour. The async
		// act call lets the dismissal requests finish inside the test.
		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /show me/i } ) );
		} );

		// The confirmed slug must save before the shared slug. Two parallel
		// saves can drop one, and a dropped confirmed slug makes the survey
		// triggers read the wrong segment. Removing the modal from the queue
		// re-persists the shared slug via the Notifications API, so it may
		// appear more than once. The ordering relative to the confirmed slug is
		// what matters.
		const dismissedSlugs = fetchMock
			.calls( dismissItemEndpoint )
			.map( ( [ , request ] ) => JSON.parse( request.body ).data.slug );
		expect( dismissedSlugs[ 0 ] ).toBe(
			SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED
		);
		expect( dismissedSlugs ).toContain( SITE_GOALS_INTRO_MODAL_BANNER );
		expect(
			dismissedSlugs.indexOf( SITE_GOALS_INTRO_MODAL_BANNER )
		).toBeGreaterThan(
			dismissedSlugs.indexOf( SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED )
		);
	} );

	it( 'does not save the confirmed dismissal item when the user clicks "Maybe later"', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
		appendTourTarget();

		const { getByRole } = render( <IntroModalComponent />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );

		// The async act call lets the dismissal request finish inside the
		// test.
		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /maybe later/i } ) );
		} );

		expect( fetchMock ).toHaveFetched( dismissItemEndpoint, {
			body: {
				data: {
					slug: SITE_GOALS_INTRO_MODAL_BANNER,
					expiration: 0,
				},
			},
		} );
		expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint, {
			body: {
				data: {
					slug: SITE_GOALS_INTRO_MODAL_BANNER_CONFIRMED,
					expiration: 0,
				},
			},
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

		const { container } = render( <IntroModalComponent />, {
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

		const { getByRole } = render( <IntroModalComponent />, {
			registry,
		} );

		await waitForIntroModalToShow( getByRole );
	} );

	describe( 'view tracking', () => {
		let originalIntersectionObserver;

		beforeEach( () => {
			originalIntersectionObserver = global.IntersectionObserver;
			global.IntersectionObserver = InViewIntersectionObserver;
		} );

		afterEach( () => {
			global.IntersectionObserver = originalIntersectionObserver;
		} );

		it( 'sends the view_notification event once the modal comes into view', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );
			appendTourTarget();

			const { getByRole } = render( <IntroModalComponent />, {
				registry,
			} );

			await waitForIntroModalToShow( getByRole );

			// The modal's content renders inside a fixed-position Dialog, so the
			// `<Notification>` wrapper's own observer never marks it viewed.
			// `BannerModal`'s `onView` fills that gap, which makes the wrapper
			// send the view event labelled with the modal variant.
			await waitFor( () => {
				expect( trackEvents.view ).toHaveBeenCalledWith(
					INTRO_MODAL_VARIANTS.ECOMMERCE,
					undefined
				);
			} );
		} );
	} );
} );
