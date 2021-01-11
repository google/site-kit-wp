/**
 * `useChecks` hook.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

/**
 * Runs a series of asynchronous checks returning the first encountered error.
 * All checks should be functions that throw their respective errors.
 *
 * @since n.e.x.t
 *
 * @param {Array} checks Array of functions to run.
 * @return {Object} An object containing complete and error properties.
 */
export function useChecks( checks ) {
	const isSiteKitConnected = useSelect( ( select ) => select( CORE_SITE ).isConnected() );
	const [ complete, setComplete ] = useState( isSiteKitConnected );
	const [ error, setError ] = useState( undefined );
	useEffect( () => {
		const runChecks = async () => {
			try {
				await Promise.all( checks.map( ( check ) => check() ) );
			} catch ( err ) {
				setError( err );
			}
			setComplete( true );
		};

		runChecks();
	}, [] );
	return { complete, error };
}
