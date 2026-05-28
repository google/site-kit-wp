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
import { useSiteGoalsTour } from '@/js/feature-tours/hooks/useSiteGoalsTour';
import { getSiteGoalsTour } from '@/js/feature-tours/site-goals';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { dismissItemEndpoint } from '../../../../../../../../tests/js/mock-dismiss-item-endpoints';
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '../../../../../../../../tests/js/test-utils';
import IntroModal from './index';

jest.mock( '@/js/googlesitekit/notifications/hooks/useNotificationEvents' );
jest.mock( '@/js/feature-tours/hooks/useSiteGoalsTour' );

describe( 'IntroModal', () => {
	let registry;

	const mockSiteGoalsTour = getSiteGoalsTour( { isEcommerceOnly: false } );

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

		jest.mocked( useSiteGoalsTour ).mockReturnValue( mockSiteGoalsTour );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
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

		const { getByRole } = render( <IntroModal />, {
			registry,
		} );

		fireEvent.click( getByRole( 'button', { name: /show me/i } ) );

		await waitFor( () => {
			expect( registry.select( CORE_USER ).getCurrentTour() ).toEqual(
				mockSiteGoalsTour
			);
		} );
	} );
} );
