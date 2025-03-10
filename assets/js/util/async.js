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
 * Defines async task.
 *
 * @since 1.142.0
 *
 * @typedef {Object} AsyncTask
 * @property {number}     priority          Priority of task – executed in ascending order.
 * @property {function(): Promise<boolean>} check Async function that resolves to a boolean. `true` if its checks pass, otherwise `false`.
 */

/**
 * Finds the highest priority task from a collection of tasks with async checks.
 *
 * @since 1.142.0
 *
 * @param {AsyncTask[]} tasks List of task objects.
 * @return {Promise<Object|null>} Promise that resolves to the highest priority task object which finishes its check first or `null` if no checks pass.
 */
export async function racePrioritizedAsyncTasks( tasks ) {
	// Group tasks by priority
	const priorityGroups = tasks.reduce( ( grouped, task ) => {
		const priority = parseInt( task.priority, 10 );
		grouped[ priority ] = grouped[ priority ] || [];
		grouped[ priority ].push(
			task
				.check()
				.then( ( result ) => ( { task, result: !! result } ) )
				.catch( () => ( { result: false } ) )
		);
		return grouped;
	}, {} );

	// Collect all given priorities in ascending order.
	const priorities = Object.keys( priorityGroups ).sort( ( a, b ) => a - b );

	// Process priority groups sequentially.
	for ( const priority of priorities ) {
		// Initialize a copy of the priority group to allow for mutation.
		let group = [ ...priorityGroups[ priority ] ];
		do {
			const winner = await Promise.race( group );

			if ( winner.result ) {
				return winner.task;
			}

			// If we got here, then the fastest task's check did not pass.
			// Filter out all tasks with completed failed checks.
			for ( const i in group ) {
				const task = group[ i ];
				if (
					( await isPromiseResolved( task ) ) &&
					false === ( await task ).result
				) {
					delete group[ i ];
				}
			}

			// Filter out empty elements for the next iteration.
			group = group.filter( ( e ) => e );
		} while ( group.length );
		// Move on to the next priority group.
	}
	return null;
}

/**
 * Checks if the given promise is resolved.
 *
 * A resolved promise is either settled or rejected, but not pending.
 *
 * @since 1.144.0
 *
 * @param {Promise} promise Promise to test.
 * @return {boolean} True if resolved, otherwise false.
 */
async function isPromiseResolved( promise ) {
	const CONTROL = 'SECRETVALUETHATNOPROMISESHOULDEVERRESOLVETO';
	// If the given value isn't a Promise, wrap it in one.
	if ( ! ( promise instanceof Promise ) ) {
		promise = Promise.resolve( promise );
	}
	// Important: while Promise.race works with non-promises, it doesn't work
	// consistently in some environments with client-side instrumentation tooling.
	return (
		CONTROL !==
		( await Promise.race( [ promise, Promise.resolve( CONTROL ) ] ) )
	);
}
