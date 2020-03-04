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
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import {
	STORE_NAME,
} from './index';

describe( 'core/site reset', () => {
	let apiFetchSpy;
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'fetchReset', () => {
			it( 'sets isDoingReset ', async () => {
				const response = true;
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/reset/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 200 }
					);

				registry.dispatch( STORE_NAME ).fetchReset();
				expect( registry.select( STORE_NAME ).isDoingReset() ).toEqual( true );
			} );
		} );

		describe( 'reset', () => {
			it( 'does not require any params', () => {
				expect( async () => {
					const response = true;
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

			it( 'resets connection ', async () => {
				const response = true;
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
					.receiveConnection( { connected: true, resettable: true } );

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

				// After a successful reset, `connection` should be `null` again.
				const connection = await registry.select( STORE_NAME ).getConnection();
				expect( connection ).toEqual( null );
			} );

			it( 'does not reset local connection  if reset request fails', async () => {
				// Make sure there is existing data in the store so we can ensure
				// it isn't reset.
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( { connected: true, resettable: true } ),
						{ status: 200 }
					);
				await registry.select( STORE_NAME ).getConnection();
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).getConnection() !== null,
				);

				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/reset/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				await registry.dispatch( STORE_NAME ).reset();
				expect( fetch ).toHaveBeenCalledTimes( 2 );

				// After a failed reset, `connection` should still exist.
				const connection = await registry.select( STORE_NAME ).getConnection();
				expect( connection ).toEqual( { connected: true, resettable: true } );
			} );
		} );
	} );
} );
