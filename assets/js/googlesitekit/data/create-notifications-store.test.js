/**
 * Notifications datastore functions tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { createNotificationsStore } from './create-notifications-store';

const STORE_NAME = 'core/site-notifications';
const STORE_ARGS = [ 'core', 'site', 'notifications' ];

describe( 'createNotificationsStore store', () => {
	let apiFetchSpy;
	let dispatch;
	let registry;
	let select;
	let storeDefinition;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createNotificationsStore( ...STORE_ARGS );
		registry.registerStore( STORE_NAME, storeDefinition );
		dispatch = registry.dispatch( STORE_NAME );
		store = registry.stores[ STORE_NAME ].store;
		select = registry.select( STORE_NAME );

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'addNotification', () => {
			it( 'requires the notification param', () => {
				expect( () => {
					dispatch.addNotification();
				} ).toThrow( 'notification is required.' );
			} );

			it( 'adds the notification to client notifications', () => {
				const notification = { id: 'added_notification' };
				dispatch.addNotification( notification );

				const state = store.getState();

				expect( state.clientNotifications ).toMatchObject( {
					[ notification.id ]: notification,
				} );
			} );
		} );

		describe( 'removeNotification', () => {
			it( 'requires the id param', () => {
				expect( () => {
					dispatch.removeNotification();
				} ).toThrow( 'id is required.' );
			} );

			it( 'does not fail when there are no notifications', () => {
				dispatch.removeNotification( 'not_a_real_id' );

				muteConsole( 'error' ); //Ignore the API fetch error here.
				expect( select.getNotifications() ).toEqual( undefined );
			} );

			it( 'does not fail when no matching notification is found', () => {
				const notification = { id: 'client_notification' };
				dispatch.addNotification( notification );

				dispatch.removeNotification( 'not_a_real_id' );

				muteConsole( 'error' ); //Ignore the API fetch error here.
				expect( select.getNotifications() ).toEqual( [ notification ] );
			} );

			it( 'removes the notification from client notifications', () => {
				const notification = { id: 'notification_to_remove' };
				dispatch.addNotification( notification );

				dispatch.removeNotification( notification.id );

				const state = store.getState();

				expect( state.clientNotifications ).toMatchObject( {} );
			} );

			it( 'removes the notification from client notifications even when no server notifications exist', () => {
				const notification = { id: 'notification_to_remove' };
				dispatch.addNotification( notification );

				dispatch.removeNotification( notification.id );

				const state = store.getState();

				expect( state.clientNotifications ).toMatchObject( {} );
				muteConsole( 'error' ); // Mute API fetch failure here.
				expect( select.getNotifications() ).toMatchObject( {} );
			} );

			it( 'does not remove server notifications and emits a warning if they are sent to removeNotification', async () => {
				const serverNotifications = [ { id: 'server_notification' } ];
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/notifications/
					)
					.mockResponseOnce(
						JSON.stringify( serverNotifications ),
						{ status: 200 }
					);

				const clientNotification = { id: 'client_notification' };

				select.getNotifications();
				dispatch.addNotification( clientNotification );

				await subscribeUntil( registry,
					() => (
						store.getState().serverNotifications !== undefined
					),
				);

				muteConsole( 'warn' );
				dispatch.removeNotification( serverNotifications[ 0 ].id );

				expect( global.console.warn ).toHaveBeenCalledWith( `Cannot remove server-side notification with ID "${ serverNotifications[ 0 ].id }"; this may be changed in a future release.` );
				expect(
					select.getNotifications()
				).toEqual( expect.arrayContaining( serverNotifications ) );
			} );
		} );

		describe( 'fetchNotifications', () => {
			it( 'does not require any params', () => {
				expect( () => {
					dispatch.fetchNotifications();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveNotifications', () => {
			it( 'requires the notifications param', () => {
				expect( () => {
					dispatch.receiveNotifications();
				} ).toThrow( 'notifications is required.' );
			} );

			it( 'receives and sets notifications', () => {
				const notifications = [ { id: 'test_notification' } ];
				dispatch.receiveNotifications( notifications );

				const state = store.getState();

				expect( state.serverNotifications ).toMatchObject( {
					[ notifications[ 0 ].id ]: notifications[ 0 ],
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getNotifications', () => {
			it( 'uses a resolver to make a network request', async () => {
				const response = [ { id: 'test_notification' } ];
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/notifications/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 200 }
					);

				const initialNotifications = select.getNotifications();
				// Notifications will be their initial value while being fetched.
				expect( initialNotifications ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						select.getNotifications() !== undefined
					),
				);

				const notifications = select.getNotifications();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( notifications ).toEqual( response );

				const notificationsSelect = select.getNotifications();
				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( notificationsSelect ).toEqual( notifications );
			} );

			it( 'returns client notifications even if server notifications have not loaded', () => {
				const notification = { id: 'added_notification' };
				dispatch.addNotification( notification );

				// Return client notifications even if the server notifications have not
				// resolved yet. They won't have here because it's the first time
				// the selector has run in this test. This ensures `undefined` is not
				// returned when server notifications haven't loaded yet, but client
				// notifications have been dispatched.
				muteConsole( 'error' ); // Ignore the API fetch failure here.
				expect( select.getNotifications() ).toEqual( [ notification ] );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/notifications/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				select.getNotifications();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingNotifications === false,
				);

				const notifications = select.getNotifications();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( notifications ).toEqual( undefined );
			} );
		} );
	} );

	describe( 'controls', () => {
		describe( 'FETCH_NOTIFICATIONS', () => {
			it( 'requests from the correct API endpoint', async () => {
				const [ type, identifier, datapoint ] = STORE_ARGS;
				const response = { type, identifier, datapoint };

				fetch
					.mockResponseOnce( async ( req ) => {
						if ( req.url.startsWith( `/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }` ) ) {
							return Promise.resolve( {
								body: JSON.stringify( response ),
								init: { status: 200 },
							} );
						}
						return Promise.resolve( {
							body: JSON.stringify( {
								code: 'incorrect_api_endpoint',
								message: 'Incorrect API endpoint',
								data: { status: 400 },
							} ),
							init: { status: 400 },
						} );
					} );

				const result = await storeDefinition.controls.FETCH_NOTIFICATIONS();
				expect( result ).toEqual( response );
				// Ensure `console.error()` wasn't called, which will happen if the API
				// request fails.
				expect( global.console.error ).not.toHaveBeenCalled();
			} );
		} );
	} );
} );
