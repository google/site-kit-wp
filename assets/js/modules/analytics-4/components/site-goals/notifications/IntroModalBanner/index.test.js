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
} from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { getSiteGoalsTour } from '@/js/modules/analytics-4/components/site-goals/feature-tours/site-goals';
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

// Adds the tour's first step target to the page, so `checkRequirements`
// resolves right away. The `afterEach` below removes it.
function appendTourTarget() {
	const target = document.createElement( 'div' );
	target.className = 'googlesitekit-site-goals-primary-action';
	document.body.appendChild( target );
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

	it( 'renders ecommerce-only variant when only ecommerce conversion events exist', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		const { container } = render( <IntroModal />, {
			registry,
		} );
		expect( container ).toMatchSnapshot();
	} );

	it( 'renders lead-only variant when only lead conversion events exist', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.CONTACT ] );

		const { container } = render( <IntroModal />, {
			registry,
		} );
		expect( container ).toMatchSnapshot();
	} );

	it( 'renders ecommerce-and-lead variant when both conversion event types exist', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [
				ENUM_CONVERSION_EVENTS.PURCHASE,
				ENUM_CONVERSION_EVENTS.CONTACT,
			] );

		const { container } = render( <IntroModal />, {
			registry,
		} );
		expect( container ).toMatchSnapshot();
	} );

	it( 'should start the Site Goals tour when the user clicks "Show me"', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setDetectedEvents( [ ENUM_CONVERSION_EVENTS.PURCHASE ] );

		// The tour waits for its first target, so add it before the click.
		appendTourTarget();

		const { getByRole } = render( <IntroModal />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /show me/i } ) );

		await waitFor( () => {
			expect( registry.select( CORE_USER ).getCurrentTour() ).toEqual(
				getSiteGoalsTour( {
					isEcommerceOnly: true,
					hasBreakdownNotice: true,
				} )
			);
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

		const { getByRole } = render( <IntroModal />, {
			registry,
		} );

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
} );
