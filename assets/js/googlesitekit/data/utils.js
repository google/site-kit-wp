/**
 * Data store utilities.
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
 * External dependencies
 */
import invariant from 'invariant';

const INITIALIZE = 'INITIALIZE';

/**
 * Add an initialize action to an existing object of actions.
 *
 * @param {Object} actions An object of actions.
 * @return {Object} The combined action object, extended with an initialize() action.
 */
export const addInitializeAction = ( actions ) => {
	return collect( actions, {
		initialize: initializeAction,
	} );
};

/**
 * Add an initialize reducer handler to an existing reducer.
 *
 * Adds a reducer that resets the store to its initial state if the
 * `initialize()` action is dispatched on it.
 *
 * @param {Object} initialState The store's default state (`INITIAL_STATE`).
 * @param {Function} reducer A single reducer to extend with an initialize() handler.
 * @return {Function} A Redux-style reducer.
 */
export const addInitializeReducer = ( initialState, reducer ) => {
	const initializeReducer = ( state, action ) => {
		switch ( action.type ) {
			case INITIALIZE: {
				return { ...initialState };
			}

			default: {
				return { ...state };
			}
		}
	};

	return collectReducers( initialState, reducer, initializeReducer );
};

export const collect = ( ...items ) => {
	const collectedObject = items.reduce( ( acc, item ) => {
		return { ...acc, ...item };
	}, {} );

	const functionNames = items.reduce( ( acc, itemSet ) => {
		return [ ...acc, ...Object.keys( itemSet ) ];
	}, [] );
	const duplicates = findDuplicates( functionNames );

	invariant( duplicates.length === 0, `collect() cannot accept collections with duplicate keys. Your call to collect() contains the following duplicated functions: ${ duplicates.join( ', ' ) }. Check your data stores for duplicates.` );

	return collectedObject;
};

export const collectActions = ( ...args ) => {
	return collect( ...args );
};

export const collectControls = collect;

/**
 * Collect all reducers and add an initialize reducer.
 *
 * This combines reducers and adds a reducer that resets the store to its
 * initial state if the `initialize()` action is dispatched on it.
 *
 * If the first argument passed is not a function, it will be used as the
 * combined reducer's `INITIAL_STATE`.
 *
 * @param {Object} initialState? The combined reducer's `INITIAL_STATE`. Only used when first argument is not a function.
 * @param {Function} ...args A list of reducers, each containing their own controls.
 * @return {Function} A Redux-style reducer.
 */
export const collectReducers = ( ...args ) => {
	const reducers = [ ...args ];
	let initialState;

	if ( typeof reducers[ 0 ] !== 'function' ) {
		initialState = reducers.shift();
	}

	return ( state = initialState, action = {} ) => {
		return reducers.reduce( ( newState, reducer ) => {
			return reducer( newState, action );
		}, state );
	};
};

export const collectResolvers = collect;

export const collectSelectors = collect;

export const collectState = collect;

const findDuplicates = ( array ) => {
	const duplicates = [];
	const counts = {};

	for ( let i = 0; i < array.length; i++ ) {
		const item = array[ i ];
		counts[ item ] = counts[ item ] >= 1 ? counts[ item ] + 1 : 1;
		if ( counts[ item ] > 1 ) {
			duplicates.push( item );
		}
	}

	return duplicates;
};

export const initializeAction = () => {
	return {
		payload: {},
		type: INITIALIZE,
	};
};
