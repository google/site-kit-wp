/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { CORE_UI } from '../../assets/js/googlesitekit/datastore/ui/constants';
import {
	createTestRegistry,
	createWaitForRegistry,
	subscribeUntil,
} from './utils';

const basicStore = {
	initialState: {
		count: 0,
	},
	actions: {
		update: () => ( { type: 'UPDATE' } ),
		noop: () => ( { type: 'NOOP' } ),
	},
	reducer( state, action ) {
		if ( action.type === 'UPDATE' ) {
			return { ...state, count: state.count + 1 };
		}
		return state;
	},
	selectors: {
		getCount: ( state ) => state.count,
	},
};
const wait = ( ms ) => new Promise( ( resolve ) => setTimeout( resolve, ms ) );

describe( 'test utilities', () => {
	describe( 'subscribeUntil', () => {
		it( 'subscribes to registry updates until predicates are satisfied', async () => {
			const registry = createTestRegistry();
			let count = 0;
			const updateRegistry = async () =>
				// async to allow await and trigger next tick
				await registry.dispatch( CORE_UI ).setValue( 'count', count++ );

			const listener = jest.fn( () => false );

			let subscribeResolved = false;
			subscribeUntil( registry, listener ).then(
				() => ( subscribeResolved = true )
			);

			expect( listener ).toHaveBeenCalledTimes( 0 );
			await updateRegistry(); // call 1
			expect( listener ).toHaveBeenCalledTimes( 1 );
			await updateRegistry(); // call 2
			expect( listener ).toHaveBeenCalledTimes( 2 );
			expect( subscribeResolved ).toBe( false );

			// Update the impl to satisfy the predicate on the next call.
			listener.mockImplementation( () => true );
			await updateRegistry(); // call 3
			expect( subscribeResolved ).toBe( true );
			expect( listener ).toHaveBeenCalledTimes( 3 );

			await updateRegistry();
			await updateRegistry();
			await updateRegistry();

			expect( listener ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'subscribes to registry updates until ALL predicates are satisfied', async () => {
			const registry = createTestRegistry();
			let count = 0;
			const updateRegistry = async () =>
				// async to allow await and trigger next tick
				await registry.dispatch( CORE_UI ).setValue( 'count', count++ );

			// eslint-disable-next-line camelcase
			const listener_a = jest.fn( () => true );
			// eslint-disable-next-line camelcase
			const listener_b = jest.fn( () => false );
			// eslint-disable-next-line camelcase
			const listener_c = jest.fn( () => false );

			let subscribeResolved = false;
			subscribeUntil( registry, listener_a, listener_b, listener_c ).then(
				() => ( subscribeResolved = true )
			);

			expect( listener_a ).toHaveBeenCalledTimes( 0 );
			expect( listener_b ).toHaveBeenCalledTimes( 0 );
			expect( listener_c ).toHaveBeenCalledTimes( 0 );
			await updateRegistry(); // call 1
			expect( subscribeResolved ).toBe( false );
			expect( listener_a ).toHaveBeenCalledTimes( 1 ); // true
			expect( listener_b ).toHaveBeenCalledTimes( 1 ); // false
			expect( listener_c ).toHaveBeenCalledTimes( 0 ); // not called (iteration stops at first false)

			listener_b.mockImplementation( () => true );
			await updateRegistry(); // call 2
			expect( subscribeResolved ).toBe( false );
			expect( listener_a ).toHaveBeenCalledTimes( 2 ); // true
			expect( listener_b ).toHaveBeenCalledTimes( 2 ); // true
			expect( listener_c ).toHaveBeenCalledTimes( 1 ); // false

			listener_c.mockImplementation( () => true );
			await updateRegistry(); // call 3
			expect( subscribeResolved ).toBe( true );
			expect( listener_a ).toHaveBeenCalledTimes( 3 ); // true
			expect( listener_b ).toHaveBeenCalledTimes( 3 ); // true
			expect( listener_c ).toHaveBeenCalledTimes( 2 ); // true

			await updateRegistry();
			await updateRegistry();
			await updateRegistry();

			expect( listener_a ).toHaveBeenCalledTimes( 3 );
			expect( listener_b ).toHaveBeenCalledTimes( 3 );
			expect( listener_c ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'createWaitForRegistry', () => {
		let registry;
		let update;
		let stateChangeListener;
		beforeEach( () => {
			registry = createRegistry();
			registry.registerStore( 'test', basicStore );
			( { update } = registry.dispatch( 'test' ) );
			stateChangeListener = jest.fn();
			registry.subscribe( stateChangeListener );
		} );

		it( 'fails if attempted to use with fake timers', () => {
			jest.useFakeTimers();
			const waitForRegistry = createWaitForRegistry( registry );

			expect( waitForRegistry ).toThrow(
				/cannot be used with fake timers/i
			);
		} );

		it( 'resolves 50ms after state changes', async () => {
			const waitForRegistry = createWaitForRegistry( registry );
			const then = jest.fn();

			const promise = waitForRegistry();
			promise.then( then );

			expect( then ).not.toHaveBeenCalled();
			await update(); // Starts timer.
			expect( stateChangeListener ).toHaveBeenCalled();
			expect( then ).not.toHaveBeenCalled();
			await wait( 40 );
			expect( then ).not.toHaveBeenCalled();
			await wait( 11 );
			expect( then ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'waits another 50ms if no state changes are detected when called', async () => {
			const waitForRegistry = createWaitForRegistry( registry );
			const then = jest.fn();

			const promise = waitForRegistry(); // Starts fallback timer.
			promise.then( then );

			expect( stateChangeListener ).not.toHaveBeenCalled();
			await wait( 40 );
			expect( then ).not.toHaveBeenCalled();
			// Need to update or it will fail.
			await update();
			await wait( 40 );
			expect( then ).not.toHaveBeenCalled();
			await wait( 11 );
			expect( then ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'errors if no state changes are detected during 50ms grace period', async () => {
			const waitForRegistry = createWaitForRegistry( registry );

			await expect( waitForRegistry ).rejects.toThrow(
				/No state changes were observed/i
			);
		} );
	} );
} );
