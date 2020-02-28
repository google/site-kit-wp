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
import { setUsingCache } from 'googlesitekit-api';
import { registerSiteKitStores } from 'assets/js/googlesitekit/data/store';
import {
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { STORE_NAME } from './index';

describe( 'core/site connection', () => {
	let apiFetchSpy;
	let registry;
	let store;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createRegistry();
		registerSiteKitStores( registry );
		store = registry.stores[ STORE_NAME ].store;

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'fetchConnection', () => {
			it( 'does not require any params', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).fetchConnection();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveConnection', () => {
			it( 'requires the connection param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveConnection();
				} ).toThrow( 'connection is required.' );
			} );

			it( 'receives and sets connection ', async () => {
				const connection = { coolSite: true };
				await registry.dispatch( STORE_NAME ).receiveConnection( connection );

				const state = store.getState();

				expect( state ).toMatchObject( { connection } );
			} );
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

				const initialConnection = registry.select( STORE_NAME ).getConnection();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialConnection ).toEqual( null );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getConnection() !== null &&
						registry.select( STORE_NAME ).getConnection() !== undefined
					),
				);

				const connection = registry.select( STORE_NAME ).getConnection();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connection ).toEqual( response );
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
				registry.select( STORE_NAME ).getConnection();
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).getConnection() !== null,
				);

				const connection = registry.select( STORE_NAME ).getConnection();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connection ).toEqual( {
					error: response,
					hasError: true,
				} );
			} );
		} );
	} );
} );
