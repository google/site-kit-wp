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
import { createTestRegistry, unsubscribeFromAll } from 'tests/js/utils';
import {
	INITIAL_STATE,
	STORE_NAME,
} from './index';

describe( 'core/site store', () => {
	let apiFetchSpy;
	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'reducer', () => {
		it( 'has the appropriate initial state', () => {
			const state = store.getState();

			expect( state ).toEqual( INITIAL_STATE );
		} );
	} );
} );
