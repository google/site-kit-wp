/**
 * `core/site` data store: notifications.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { actions, selectors } from './index';

import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site notifications', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		fetchMock.post(
			/^\/google-site-kit\/v1\/core\/site\/data\/mark-notification/,
			{ body: 'true', status: 200 }
		);
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'fetchMarkNotification', () => {
			it.each( [
				[ 'abc', 'accepted' ],
				[ 'abc', 'dismissed' ],
			] )(
				'should not throw if the notificationID is "%s" and notification state is "%s".',
				( notificationID, notificationState ) => {
					expect( () =>
						registry.dispatch( CORE_SITE ).fetchMarkNotification( {
							notificationID,
							notificationState,
						} )
					).not.toThrow();
				}
			);
			it.each( [
				[ 'abc', 'test' ],
				[ 'abc', undefined ],
				[ undefined, 'accepted' ],
			] )(
				'throws an error while trying to marks a notification when the notification ID is "%s" and notification state is "%s".',
				( notificationID, notificationState ) => {
					expect( () =>
						registry.dispatch( CORE_SITE ).fetchMarkNotification( {
							notificationID,
							notificationState,
						} )
					).toThrow();
				}
			);
		} );
		describe( 'acceptNotification', () => {
			it.each( [ [ 'abc' ] ] )(
				'properly accepts a notification when the notification ID is "%s".',
				( notificationID ) => {
					expect( () =>
						registry
							.dispatch( CORE_SITE )
							.acceptNotification( notificationID )
					).not.toThrow();
				}
			);
			it.each( [ [ undefined, true ] ] )(
				'throws an error when trying to accept a notification when the notification ID is "%s".',
				( notificationID ) => {
					expect( () =>
						registry
							.dispatch( CORE_SITE )
							.acceptNotification( notificationID )
					).toThrow();
				}
			);
		} );
		describe( 'dismissNotification', () => {
			it.each( [ [ 'abc' ] ] )(
				'properly dismisses a notification when the notification ID is "%s".',
				( notificationID ) => {
					expect( () =>
						registry
							.dispatch( CORE_SITE )
							.dismissNotification( notificationID )
					).not.toThrow();
				}
			);
			it.each( [ [ undefined, true ] ] )(
				'throws an error when trying to dismiss a notification when the notification ID is "%s".',
				( notificationID ) => {
					expect( () =>
						registry
							.dispatch( CORE_SITE )
							.dismissNotification( notificationID )
					).toThrow();
				}
			);
		} );

		it( 'has appropriate notification actions', () => {
			const actionsToExpect = [
				'acceptNotification',
				'addNotification',
				'dismissNotification',
				'fetchMarkNotification',
				'removeNotification',
			];
			expect( Object.keys( actions ) ).toEqual(
				expect.arrayContaining( actionsToExpect )
			);
		} );
	} );

	describe( 'selectors', () => {
		it( 'has appropriate notification selectors', () => {
			const selectorsToExpect = [
				'getNotifications',
				'isFetchingGetNotifications',
				'isFetchingMarkNotification',
			];
			expect( Object.keys( selectors ) ).toEqual(
				expect.arrayContaining( selectorsToExpect )
			);
		} );
	} );
} );
