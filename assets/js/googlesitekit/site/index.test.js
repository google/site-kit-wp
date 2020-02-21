/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { setUsingCache } from 'googlesitekit-api';
import { createRegistry } from 'googlesitekit-data';
import createStoreOnRegistry from 'assets/js/googlesitekit/store';
import { muteConsole, subscribeUntil, unsubscribeFromAll } from 'tests/js/utils';
import {
	INITIAL_STATE,
	STORE_NAME,
} from './index';
import {
	RECEIVE_CONNECTION_INFO,
} from './index.private';

describe( ' core/site store ', () => {
	let apiFetchSpy;
	let registry;
	let store;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();
		createStoreOnRegistry( registry );
		store = registry.stores[ STORE_NAME ].store;

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	beforeAll( () => {
		setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'fetchConnectionInfo', () => {
			it( 'does not require any params', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).fetchConnectionInfo();
				} ).not.toThrow();
			} );

			it( 'sets isFetchingConnectionInfo', async () => {
				expect(
					registry.select( STORE_NAME ).isFetchingConnectionInfo()
				).toEqual( false );

				registry.dispatch( STORE_NAME ).fetchConnectionInfo();

				expect(
					registry.select( STORE_NAME ).isFetchingConnectionInfo()
				).toEqual( true );
			} );
		} );

		describe( 'receiveConnectionInfo', () => {
			it( 'requires the connectionInfo param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveConnectionInfo();
				} ).toThrow( 'connectionInfo is required.' );
			} );

			it( 'dispatches the correct action/payload', async () => {
				const connectionInfo = { coolSite: true };
				const action = await registry.dispatch( STORE_NAME ).receiveConnectionInfo( connectionInfo );

				expect( action ).toEqual( {
					payload: { connectionInfo },
					type: RECEIVE_CONNECTION_INFO,
				} );
			} );

			it( 'receives and sets connection info', async () => {
				const connectionInfo = { coolSite: true };
				await registry.dispatch( STORE_NAME ).receiveConnectionInfo( connectionInfo );

				const state = store.getState();

				expect( state ).toMatchObject( { connectionInfo } );
			} );
		} );

		describe( 'reset', () => {
			it( 'does not require any params', () => {
				expect( async () => {
					const response = { success: true };
					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/core\/site\/data\/reset/
						)
						.mockResponseOnce(
							JSON.stringify( response ),
							{ status: 200 }
						);

					await registry.dispatch( STORE_NAME ).reset();
				} ).not.toThrow();
			} );

			it( 'resets connection info', async () => {
				const response = { success: true };
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/reset/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 200 }
					);

				registry
					.dispatch( STORE_NAME )
					.receiveConnectionInfo( { connected: true, resettable: true } );

				await registry.dispatch( STORE_NAME ).reset();
				expect( fetch ).toHaveBeenCalledTimes( 1 );

				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( { connected: false, resettable: false } ),
						{ status: 200 }
					);

				// After a successful reset, `connectionInfo` should be `null` again.
				const connectionInfo = await registry.select( STORE_NAME ).getConnection();
				expect( connectionInfo ).toEqual( null );
			} );
		} );
	} );

	describe( 'reducer', () => {
		it( 'has the appropriate initial state', () => {
			const state = store.getState();

			expect( state ).toEqual( INITIAL_STATE );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getConnection', () => {
			it( 'uses a resolver to make a network request', async () => {
				const response = { connected: true, resettable: true };
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 200 }
					);

				await registry.select( STORE_NAME ).getConnection();
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).getConnection() !== null,
				);

				const connectionInfo = await registry.select( STORE_NAME ).getConnection();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connectionInfo ).toEqual( response );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				await registry.select( STORE_NAME ).getConnection();
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).getConnection() !== null,
				);

				const connectionInfo = await registry.select( STORE_NAME ).getConnection();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connectionInfo ).toEqual( {
					error: response,
					hasError: true,
				} );
			} );
		} );
	} );
} );
