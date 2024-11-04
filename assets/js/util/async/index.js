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
 * Finds the highest priority task from a collection of tasks with async checks.
 *
 * @since n.e.x.t
 *
 * @param {Object}   registry The registry instance.
 * @param {Object[]} tasks    List of task objects.
 * @return {Promise<Object|null>} Promise that resolves to the highest priority task object which finishes its check first or `null` if no checks pass.
 */
export async function racePrioritizedAsyncTasks( registry, tasks ) {
	// Group tasks by priority
	const priorityGroups = tasks.reduce( ( grouped, task ) => {
		const priority = parseInt( task.priority, 10 );
		grouped[ priority ] = grouped[ priority ] || [];
		grouped[ priority ].push(
			// Wrap the check result in a Promise in case the check is not async.
			Promise.resolve( task.check( registry ) )
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
				// Here `r` will either be `false` if the promise is pending, or
				// an object `{ task, result }` as set above.
				const r = await Promise.race( [ group[ i ], false ] );
				if ( r && ! r.result ) {
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
