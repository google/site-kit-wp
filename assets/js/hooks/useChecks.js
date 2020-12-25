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
//import { useEffect } from '@wordpress/element';
import Data from 'googlesitekit-data';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
// const { useSelect, useDispatch } = Data;
const { useSelect } = Data;

/**
 * Debounces a value after the specified delay.
 *
 * @since 1.16.0
 *
 * @param {Array} checks The checks to run.
 * @return {string} The update value after the delay.
 */
export function useChecks( checks ) {
	const isSiteKitConnected = useSelect( ( select ) => select( CORE_SITE ).isConnected() );
	// let complete = !! isSiteKitConnected;
	// let error = null;
	const [ complete, setComplete ] = useState( isSiteKitConnected );
	const [ error, setError ] = useState( undefined );
	useEffect( () => {
		const runChecks = async () => {
			try {
				await Promise.all( checks.map( ( check ) => check() ) );
				console.log( 2 ); // eslint-disable-line no-console
				// complete = true;
				setComplete( true );
			} catch ( err ) {
				setError( error );
				// error = err;
			}
		};

		runChecks();

		/*
		( async function runChecks() {
			try {
				await Promise.all( checks.map( ( check ) => check() ) );
				console.log( 2 ); // eslint-disable-line no-console
				complete = true;
			} catch ( err ) {
				error = err;
			}
		}() );
		 */
	}, [] );
	console.log( complete ); // eslint-disable-line no-console
	console.log( error ); // eslint-disable-line no-console
	return { complete, error };
	/*
	let complete = isSiteKitConnected;
	let error;
	//const [ complete, setComplete ] = useState( isSiteKitConnected );
	// const [ error, setError ] = useState( undefined );
	// const { checkSetupTag } = useDispatch( CORE_SITE );
	// checks.push( checkSetupTag );

	useEffect(
		() => {
			( async () => {
				try {
					await Promise.all( checks.map( ( check ) => check() ) );
					console.log( 2 ); // eslint-disable-line no-console
					complete = true;
				} catch ( err ) {
					error = err;
				}
			} )();
		},
		// [ complete, error ]
		[]
	);

	console.log( 3 ); // eslint-disable-line no-console
	console.log( complete ); // eslint-disable-line no-console
	return { complete, error };
	 */
}

