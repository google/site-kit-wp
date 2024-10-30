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
import { racePrioritizedAsyncTasks } from '.';

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
