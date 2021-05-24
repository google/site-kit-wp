/**
 * `useChecks` hook.
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
 * External dependencies
 */
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Runs a series of checks returning the first encountered error.
 * All checks should be functions that throw their respective errors.
 *
 * @since 1.25.0
 * @since 1.28.0 Checks are run sequentially rather than in parallel.
 *
 * @param {Function[]} checks Array of functions to run.
 * @return {Object} An object containing complete and error properties.
 */
export function useChecks( checks ) {
	const [ stableChecks ] = useState( checks );
	const [ complete, setComplete ] = useState( ! stableChecks?.length );
	const [ error, setError ] = useState( undefined );

	useMount( () => {
		const runChecks = async () => {
			try {
				for ( const check of stableChecks ) {
					await check();
				}
			} catch ( err ) {
				setError( err );
			}
			setComplete( true );
		};

		if ( ! complete ) {
			runChecks();
		}
	} );

	return { complete, error };
}
