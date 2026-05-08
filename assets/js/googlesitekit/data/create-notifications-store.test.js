/**
 * Notifications datastore functions tests.
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
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { setUsingCache } from 'googlesitekit-api';
import { combineStores, commonStore } from 'googlesitekit-data';
import { muteFetch, subscribeUntil } from '../../../../tests/js/utils';
import { createNotificationsStore } from './create-notifications-store';

const STORE_ARGS = [ 'core', 'site', 'notifications' ];

describe( 'createNotificationsStore store', () => {
	let dispatch;
	let registry;
	let select;
	let storeDefinition;
	let store;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();

		storeDefinition = createNotificationsStore( ...STORE_ARGS );

		store = registry.registerStore(
			storeDefinition.STORE_NAME,
			combineStores( commonStore, storeDefinition )
		);

		dispatch = registry.dispatch( storeDefinition.STORE_NAME );
		select = registry.select( storeDefinition.STORE_NAME );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	describe( 'name', () => {
		it( 'returns the correct default store name', () => {
			expect( storeDefinition.STORE_NAME ).toEqual(
				`${ STORE_ARGS[ 0 ] }/${ STORE_ARGS[ 1 ] }`
			);
		} );
	} );

	describe( 'actions', () => {
		describe( 'fetchGetNotifications', () => {
			it( 'does not require any params', () => {
				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/notifications'
					),
					[]
				);
				expect( () => {
					dispatch.fetchGetNotifications();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetNotifications', () => {
			it( 'requires the response param', () => {
				expect( () => {
					dispatch.receiveGetNotifications();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets notifications', () => {
				const notifications = [ { id: 'test_notification' } ];
				dispatch.receiveGetNotifications( notifications, {} );

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
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/notifications'
					),
					{ body: response, status: 200 }
				);

				const initialNotifications = select.getNotifications();
				// Notifications will be their initial value while being fetched.
				expect( initialNotifications ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() => select.getNotifications() !== undefined
				);

				const notifications = select.getNotifications();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( notifications ).toEqual( response );

				const notificationsSelect = select.getNotifications();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( notificationsSelect ).toEqual( notifications );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/notifications'
					),
					{ body: response, status: 500 }
				);

				select.getNotifications();
				await subscribeUntil( registry, () =>
					select.hasFinishedResolution( 'getNotifications' )
				);

				const notifications = select.getNotifications();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( notifications ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'controls', () => {
		describe( 'FETCH_GET_NOTIFICATIONS', () => {
			it( 'requests from the correct API endpoint', async () => {
				const [ type, identifier, datapoint ] = STORE_ARGS;
				const response = { type, identifier, datapoint };

				fetchMock
					.getOnce(
						`path:/google-site-kit/v1/${ type }/${ identifier }/data/${ datapoint }`,
						{ body: response, status: 200 }
					)
					.catch( {
						body: {
							code: 'incorrect_api_endpoint',
							message: 'Incorrect API endpoint',
							data: { status: 400 },
						},
						init: { status: 400 },
					} );

				const result =
					await storeDefinition.controls.FETCH_GET_NOTIFICATIONS( {
						payload: { params: {} },
						type: 'FETCH_GET_NOTIFICATIONS',
					} );
				expect( result ).toEqual( response );
				// Ensure `console.error()` wasn't called, which will happen if the API
				// request fails.
				expect( global.console.error ).not.toHaveBeenCalled();
			} );
		} );
	} );
} );
