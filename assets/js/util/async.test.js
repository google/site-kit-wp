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
 * Internal dependencies
 */
import {
	asyncRequire,
	asyncRequireAll,
	asyncRequireAny,
	racePrioritizedAsyncTasks,
} from './async';

describe( 'racePrioritizedAsyncTasks', () => {
	it( 'should return the first task with the highest priority', async () => {
		const tasks = [
			{ priority: 2, check: () => Promise.resolve( true ) },
			{ priority: 1, check: () => Promise.resolve( false ) },
		];

		const result = await racePrioritizedAsyncTasks( tasks );
		expect( result ).toBe( tasks[ 0 ] );
	} );

	it( 'should return the first task that passes within a priority group', async () => {
		const tasks = [
			{ priority: 1, check: () => Promise.resolve( false ) },
			{ priority: 1, check: () => Promise.resolve( true ) },
			{ priority: 1, check: () => Promise.resolve( false ) },
		];

		const result = await racePrioritizedAsyncTasks( tasks );
		expect( result ).toBe( tasks[ 1 ] );
	} );

	it( 'should return the first task that passes from the highest priority group', async () => {
		const tasks = [
			{ priority: 2, check: () => Promise.resolve( false ) },
			{ priority: 1, check: () => Promise.resolve( true ) },
		];

		const result = await racePrioritizedAsyncTasks( tasks );
		expect( result ).toBe( tasks[ 1 ] );
	} );

	it( 'should return null if no tasks pass', async () => {
		const tasks = [
			{ priority: 1, check: () => Promise.resolve( false ) },
			{ priority: 2, check: () => Promise.resolve( false ) },
		];

		const result = await racePrioritizedAsyncTasks( tasks );
		expect( result ).toBeNull();
	} );

	it( 'should handle tasks with different execution times across priority groups', async () => {
		const tasks = [
			{ priority: 2, check: () => Promise.resolve( true ) },
			{
				priority: 1,
				check: () =>
					new Promise( ( resolve ) =>
						setTimeout( resolve, 100, true )
					),
			},
		];

		const result = await racePrioritizedAsyncTasks( tasks );
		expect( result ).toBe( tasks[ 1 ] );
	} );
} );

describe( 'asyncRequire* utilities', () => {
	describe( 'asyncRequireAll', () => {
		it( 'accepts any number of predicate functions that all receive the same arguments when the returned function is called', async () => {
			const predicates = [
				jest.fn( () => true ),
				jest.fn( () => true ),
				jest.fn( () => true ),
			];
			const requiresAll = asyncRequireAll( ...predicates );

			await requiresAll( 'test', 'one' );
			await requiresAll( 'test', 'two' );

			// In order to make assertions about all the calls, we need to make an assertion on them all at once.
			const predicateNumCalls = predicates.map(
				( fn ) => fn.mock.calls.length
			);
			// Each predicate function should have been called two times.
			expect( predicateNumCalls ).toEqual( [ 2, 2, 2 ] );

			// Each call should have received the same args as the function returned by asyncRequireAll.
			const predicateCalledArgs = predicates.map(
				( fn ) => fn.mock.calls
			);
			const expectedArgs = predicates.map( () => [
				[ 'test', 'one' ],
				[ 'test', 'two' ],
			] );
			expect( predicateCalledArgs ).toEqual( expectedArgs );
		} );

		it( 'calls each function in the order it is given', async () => {
			const calledOrder = [];
			const predicates = [
				jest.fn( () => calledOrder.push( 'first' ) && true ),
				jest.fn( () => calledOrder.push( 'second' ) && true ),
				jest.fn( () => calledOrder.push( 'third' ) && true ),
			];
			const requiresAll = asyncRequireAll( ...predicates );

			await requiresAll();

			expect( calledOrder ).toEqual( [ 'first', 'second', 'third' ] );
		} );

		it( 'does not call subsequent predicate functions after the first which does not return true', async () => {
			const calledOrder = [];
			const predicates = [
				jest.fn( () => calledOrder.push( 'first' ) && true ),
				jest.fn( () => calledOrder.push( 'second' ) && false ), // <<<<<
				jest.fn( () => calledOrder.push( 'third' ) && true ),
			];
			const requiresAll = asyncRequireAll( ...predicates );

			await requiresAll();

			// The third is not called because the second returns false.
			expect( calledOrder ).toEqual( [ 'first', 'second' ] );
		} );

		it( 'returns true when all predicates return true', async () => {
			const requirements = [
				() => Promise.resolve( true ),
				() => Promise.resolve( true ),
				() => Promise.resolve( true ),
			];
			expect( await asyncRequireAll( ...requirements )() ).toBe( true );
		} );

		it( 'returns false when any predicate returns false', async () => {
			const requirements = [
				() => Promise.resolve( true ),
				() => Promise.resolve( false ),
				() => Promise.resolve( true ),
			];
			expect( await asyncRequireAll( ...requirements )() ).toBe( false );
		} );
	} );

	describe( 'asyncRequireAny', () => {
		it( 'accepts any number of predicate functions that all receive the same arguments when the returned function is called', async () => {
			const predicates = [
				jest.fn( () => false ),
				jest.fn( () => false ),
				jest.fn( () => false ),
			];
			const requiresAll = asyncRequireAny( ...predicates );

			await requiresAll( 'test', 'one' );
			await requiresAll( 'test', 'two' );

			// In order to make assertions about all the calls, we need to make an assertion on them all at once.
			const predicateNumCalls = predicates.map(
				( fn ) => fn.mock.calls.length
			);
			// Each predicate function should have been called two times.
			expect( predicateNumCalls ).toEqual( [ 2, 2, 2 ] );

			// Each call should have received the same args as the function returned by asyncRequireAll.
			const predicateCalledArgs = predicates.map(
				( fn ) => fn.mock.calls
			);
			const expectedArgs = predicates.map( () => [
				[ 'test', 'one' ],
				[ 'test', 'two' ],
			] );
			expect( predicateCalledArgs ).toEqual( expectedArgs );
		} );

		it( 'calls each function in the order it is given', async () => {
			const calledOrder = [];
			const predicates = [
				jest.fn( () => calledOrder.push( 'first' ) && false ),
				jest.fn( () => calledOrder.push( 'second' ) && false ),
				jest.fn( () => calledOrder.push( 'third' ) && false ),
			];
			const requiresAll = asyncRequireAny( ...predicates );

			await requiresAll();

			expect( calledOrder ).toEqual( [ 'first', 'second', 'third' ] );
		} );

		it( 'returns true when any predicate returns true', async () => {
			const requirements = [
				() => Promise.resolve( false ),
				() => Promise.resolve( true ),
				() => Promise.resolve( false ),
			];
			expect( await asyncRequireAny( ...requirements )() ).toBe( true );
		} );

		it( 'returns false when all predicates return false', async () => {
			const requirements = [
				() => Promise.resolve( false ),
				() => Promise.resolve( false ),
				() => Promise.resolve( false ),
			];
			expect( await asyncRequireAny( ...requirements )() ).toBe( false );
		} );
	} );

	describe( 'asyncRequire', () => {
		it( 'accepts a value and a function which is called when the returned function is called', () => {
			const fn = jest.fn();
			const predicate = asyncRequire( 'foo', fn );

			predicate( 'testing', 123 );

			expect( fn ).toHaveBeenCalledTimes( 1 );
			expect( fn ).toHaveBeenCalledWith( 'testing', 123 );
		} );

		it.each( [
			[ 'foo', 'fn returns foo', true, () => 'foo' ],
			[ 'foo', 'fn returns bar', false, () => 'bar' ],
			[ true, 'fn returns string true', false, () => 'true' ],
			[ null, 'fn returns false', false, () => false ],
		] )(
			'returns a predicate function which only returns true if the function its given returns the same value as given (value %s, %s, result: %s)',
			async ( given, _, expectedReturn, fn ) => {
				expect( await asyncRequire( given, fn )() ).toEqual(
					expectedReturn
				);
			}
		);
	} );
} );
