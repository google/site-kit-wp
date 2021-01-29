/**
 * `useDebounce` hook, from @wordpress/compose.
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

// @TODO When we upgrade React to 16.4, we can also upgrade @wordpress/compose, and then this file can be removed.

/**
 * External dependencies
 */
import { useRef, useState } from 'react';
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Compares input arrays.
 *
 * This is a dependency of @wordpress/compose/useDebounce.
 *
 * @since n.e.x.t
 * @see https://github.com/alexreardon/use-memo-one
 *
 * @param {Array} newInputs  Array of new inputs to compare.
 * @param {Array} lastInputs Array of previouse inputs.
 * @return {boolean} Whether the two sets of inputs are the same.
 */
function areInputsEqual( newInputs, lastInputs ) {
	if ( newInputs.length !== lastInputs.length ) {
		return false;
	}

	for ( let i = 0; i < newInputs.length; i++ ) {
		if ( newInputs[ i ] !== lastInputs[ i ] ) {
			return false;
		}
	}
	return true;
}

/**
 * Provides UseMemo with a semantic guarantee.
 *
 * This is a dependency of @wordpress/compose/useDebounce.
 *
 * @since n.e.x.t
 * @see https://github.com/alexreardon/use-memo-one
 *
 * @param {Function} getResult Returns a cache object.
 * @param {Array}    inputs    Array of inputs.
 * @return {Object} Cache object.
 */
function useMemoOne( getResult, inputs ) {
	const initial = useState( () => ( {
		inputs,
		result: getResult(),
	} ) )[ 0 ];
	const isFirstRun = useRef( true );
	const committed = useRef( initial );

	const useCache = isFirstRun.current || Boolean( inputs && committed.current.inputs && areInputsEqual( inputs, committed.current.inputs ) );

	const cache = useCache
		? committed.current
		: {
			inputs,
			result: getResult(),
		};

	useEffect( () => {
		isFirstRun.current = false;
		committed.current = cache;
	}, [ cache ] );

	return cache.result;
}

/**
 * Debounces a function with Lodash's `debounce`.
 *
 * A new debounced function will be returned and any scheduled calls
 * cancelled if any of the arguments change, including the function to debounce,
 * so please wrap functions created on render in components in `useCallback`.
 *
 * @since n.e.x.t
 *
 * @param {...any} args Arguments passed to Lodash's `debounce`.
 * @return {Function} Debounced function.
 */
export function useDebounce( ...args ) {
	const debounced = useMemoOne( () => debounce( ...args ), args );
	useEffect( () => () => debounced.cancel(), [ debounced ] );
	return debounced;
}
