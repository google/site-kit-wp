/**
 * Notification component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	act,
} from '../../../../../../tests/js/test-utils';
import { CORE_NOTIFICATIONS } from '../../datastore/constants';
import { CORE_UI } from '../../../datastore/ui/constants';
import Notification from '.';

// Mock the useLatestIntersection hook to control intersection state.
jest.mock( '../../../../hooks/useLatestIntersection', () => {
	return jest.fn().mockImplementation( () => ( {
		isIntersecting: true,
	} ) );
} );

// Mock the useHasBeenViewed hook to control viewed state.
jest.mock( '../../hooks/useHasBeenViewed', () => {
	const originalModule = jest.requireActual( '../../hooks/useHasBeenViewed' );
	const mockUseHasBeenViewed = jest.fn().mockReturnValue( false );
	mockUseHasBeenViewed.getKey = originalModule.useHasBeenViewed.getKey;

	return {
		...originalModule,
		useHasBeenViewed: mockUseHasBeenViewed,
	};
} );

describe( 'Notification', () => {
	let registry;
	let mockMarkNotificationSeen;
	let mockSetValue;
	let mockDismissNotification;

	beforeEach( () => {
		jest.useFakeTimers();

		registry = createTestRegistry();

		// Mock the actions.
		mockMarkNotificationSeen = jest.fn();
		mockSetValue = jest.fn();
		mockDismissNotification = jest.fn();

		registry.dispatch( CORE_NOTIFICATIONS ).markNotificationSeen =
			mockMarkNotificationSeen;
		registry.dispatch( CORE_UI ).setValue = mockSetValue;
		registry.dispatch( CORE_NOTIFICATIONS ).dismissNotification =
			mockDismissNotification;

		// Mock the getNotificationSeenDates selector.
		registry.select( CORE_NOTIFICATIONS ).getNotificationSeenDates = jest
			.fn()
			.mockReturnValue( [] );
	} );

	afterEach( () => {
		jest.useRealTimers();
		jest.clearAllMocks();
	} );

	it( 'renders the notification content', () => {
		const { getByText } = render(
			<Notification id="test-notification">
				Test Notification Content
			</Notification>,
			{ registry }
		);

		expect( getByText( 'Test Notification Content' ) ).toBeInTheDocument();
	} );

	it( 'dismisses the notification when it has been viewed on 3 distinct days', () => {
		registry.select( CORE_NOTIFICATIONS ).getNotificationSeenDates = jest
			.fn()
			.mockReturnValue( [ '2025-04-27', '2025-04-28', '2025-04-29' ] );

		render(
			<Notification id="test-notification">
				Test Notification Content
			</Notification>,
			{ registry }
		);

		expect( mockDismissNotification ).toHaveBeenCalledWith(
			'test-notification',
			{ skipHidingFromQueue: true }
		);
	} );

	it( 'does not dismiss the notification when it has been viewed on fewer than 3 distinct days', () => {
		registry.select( CORE_NOTIFICATIONS ).getNotificationSeenDates = jest
			.fn()
			.mockReturnValue( [ '2025-04-28', '2025-04-29' ] );

		render(
			<Notification id="test-notification">
				Test Notification Content
			</Notification>,
			{ registry }
		);

		expect( mockDismissNotification ).not.toHaveBeenCalled();
	} );

	it( 'marks notification as seen only after being in view for 3 seconds', () => {
		render(
			<Notification id="test-notification">
				Test Notification Content
			</Notification>,
			{ registry }
		);

		// Verify markNotificationSeen is not called immediately.
		expect( mockMarkNotificationSeen ).not.toHaveBeenCalled();

		act( () => {
			jest.advanceTimersByTime( 2000 );
		} );

		// Verify markNotificationSeen is still not called.
		expect( mockMarkNotificationSeen ).not.toHaveBeenCalled();

		// Advance time to complete the timeout.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		expect( mockMarkNotificationSeen ).toHaveBeenCalledWith(
			'test-notification'
		);
	} );

	it( 'does not mark notification as seen if view ends before 3 seconds', () => {
		const useLatestIntersection = require( '../../../../hooks/useLatestIntersection' );

		// Initially in view.
		useLatestIntersection.mockReturnValue( { isIntersecting: true } );

		const { rerender } = render(
			<Notification id="test-notification">
				Test Notification Content
			</Notification>,
			{ registry }
		);

		act( () => {
			jest.advanceTimersByTime( 2000 );
		} );

		// Change to not in view.
		useLatestIntersection.mockReturnValue( { isIntersecting: false } );

		rerender(
			<Notification id="test-notification">
				Test Notification Content
			</Notification>
		);

		// Advance time to complete the timeout.
		act( () => {
			jest.advanceTimersByTime( 1000 );
		} );

		// Verify markNotificationSeen was not called.
		expect( mockMarkNotificationSeen ).not.toHaveBeenCalled();
	} );
} );
