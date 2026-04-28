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
 * Internal dependencies
 */
import {
	createTestRegistry,
	render,
} from '../../../../../../../tests/js/test-utils';
import {
	ENUM_CONVERSION_EVENTS,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import IntroModal from './index';
import useNotificationEvents from '@/js/googlesitekit/notifications/hooks/useNotificationEvents';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';

jest.mock( '@/js/googlesitekit/notifications/hooks/useNotificationEvents' );

describe( 'IntroModal', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		useNotificationEvents.mockReturnValue( {
			view: jest.fn(),
			confirm: jest.fn(),
			clickLearnMore: jest.fn(),
			dismiss: jest.fn(),
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
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
} );
