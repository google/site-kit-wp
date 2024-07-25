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

import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site notifications', () => {
	let registry;

	const markNotificationsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/mark-notification'
	);

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {} );

	describe( 'actions', () => {
		describe( 'fetchMarkNotification', () => {
			it.each( [
				[ 'abc', 'accepted' ],
				[ 'abc', 'dismissed' ],
			] )(
				'should not throw if the notificationID is "%s" and notification state is "%s".',
				( notificationID, notificationState ) => {
					fetchMock.postOnce( markNotificationsEndpoint, {
						body: 'true',
						status: 200,
					} );
					expect( () =>
						registry.dispatch( CORE_SITE ).fetchMarkNotification( {
							notificationID,
							notificationState,
						} )
					).not.toThrow();
					expect( fetchMock ).toHaveFetched(
						markNotificationsEndpoint,
						{
							body: {
								data: {
									notificationID,
									notificationState,
								},
							},
						}
					);
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
			it( 'accepts a notification with a valid notification ID.', () => {
				fetchMock.postOnce( markNotificationsEndpoint, {
					body: 'true',
					status: 200,
				} );
				expect( () =>
					registry.dispatch( CORE_SITE ).acceptNotification( 'abc' )
				).not.toThrow();
				expect( fetchMock ).toHaveFetched( markNotificationsEndpoint, {
					body: {
						data: {
							notificationID: 'abc',
							notificationState: 'accepted',
						},
					},
				} );
			} );

			it( 'sets an error when API returns one.', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.postOnce( markNotificationsEndpoint, {
					body: response,
					status: 500,
				} );
				await registry
					.dispatch( CORE_SITE )
					.acceptNotification( 'abc' );
				expect(
					registry
						.select( CORE_SITE )
						.getErrorForAction( 'acceptNotification', [ 'abc' ] )
				).toMatchObject( response );
				expect( fetchMock ).toHaveFetched( markNotificationsEndpoint, {
					body: {
						data: {
							notificationID: 'abc',
							notificationState: 'accepted',
						},
					},
				} );
				expect( console ).toHaveErrored();
			} );
			it.each( [ undefined, true ] )(
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
			it( 'dismisses a notification with a valid notification ID.', () => {
				fetchMock.postOnce( markNotificationsEndpoint, {
					body: 'true',
					status: 200,
				} );
				expect( () =>
					registry.dispatch( CORE_SITE ).dismissNotification( 'abc' )
				).not.toThrow();
				expect( fetchMock ).toHaveFetched( markNotificationsEndpoint, {
					body: {
						data: {
							notificationID: 'abc',
							notificationState: 'dismissed',
						},
					},
				} );
			} );
			it( 'sets an error when API returns one.', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.postOnce( markNotificationsEndpoint, {
					body: response,
					status: 500,
				} );
				await registry
					.dispatch( CORE_SITE )
					.dismissNotification( 'abc' );
				expect(
					registry
						.select( CORE_SITE )
						.getErrorForAction( 'dismissNotification', [ 'abc' ] )
				).toMatchObject( response );
				expect( fetchMock ).toHaveFetched( markNotificationsEndpoint, {
					body: {
						data: {
							notificationID: 'abc',
							notificationState: 'dismissed',
						},
					},
				} );
				expect( console ).toHaveErrored();
			} );
			it.each( [ undefined, true ] )(
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

		it.each( [
			'acceptNotification',
			'addNotification',
			'dismissNotification',
			'fetchMarkNotification',
			'removeNotification',
		] )( 'has the "%s" notification action.', ( actionName ) => {
			expect( actions[ actionName ] ).toBeDefined();
		} );
	} );

	describe( 'selectors', () => {
		it.each( [
			'getNotifications',
			'isFetchingGetNotifications',
			'isFetchingMarkNotification',
		] )( 'has the "%s" notification selector.', ( selectorName ) => {
			expect( selectors[ selectorName ] ).toBeDefined();
		} );
	} );
} );
