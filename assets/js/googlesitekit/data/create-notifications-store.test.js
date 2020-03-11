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
	let registry;
	let storeDefinition;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createNotificationsStore( ...STORE_ARGS );
		registry.registerStore( STORE_NAME, storeDefinition );
		store = registry.stores[ STORE_NAME ].store;

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
					registry.dispatch( STORE_NAME ).addNotification();
				} ).toThrow( 'notification is required.' );
			} );

			it( 'adds the notification to client notifications', async () => {
				const notification = { id: 'added_notification' };
				await registry.dispatch( STORE_NAME ).addNotification( notification );

				const state = store.getState();

				expect( state.clientNotifications ).toMatchObject( {
					[ notification.id ]: notification,
				} );
			} );
		} );
		describe( 'removeNotification', () => {
			it( 'requires the id param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).removeNotification();
				} ).toThrow( 'id is required.' );
			} );

			it( 'removes the notification from client notifications', async () => {
				const notification = { id: 'notification_to_remove' };
				await registry.dispatch( STORE_NAME ).addNotification( notification );

				await registry.dispatch( STORE_NAME ).removeNotification( notification.id );

				const state = store.getState();

				expect( state.clientNotifications ).toMatchObject( {} );
			} );
		} );

		describe( 'fetchNotifications', () => {
			it( 'does not require any params', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).fetchNotifications();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveNotifications', () => {
			it( 'requires the notifications param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveNotifications();
				} ).toThrow( 'notifications is required.' );
			} );

			it( 'receives and sets notifications', async () => {
				const notifications = [ { id: 'test_notification' } ];
				await registry.dispatch( STORE_NAME ).receiveNotifications( notifications );

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

				const initialNotifications = registry.select( STORE_NAME ).getNotifications();
				// Notifications will be their initial value while being fetched.
				expect( initialNotifications ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getNotifications() !== undefined
					),
				);

				const notifications = registry.select( STORE_NAME ).getNotifications();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( notifications ).toEqual( response );

				const notificationsSelect = registry.select( STORE_NAME ).getNotifications();
				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( notificationsSelect ).toEqual( notifications );
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
				registry.select( STORE_NAME ).getNotifications();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingNotifications === false,
				);

				const notifications = registry.select( STORE_NAME ).getNotifications();

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
			} );
		} );
	} );
} );
