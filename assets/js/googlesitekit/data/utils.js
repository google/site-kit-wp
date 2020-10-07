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

/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

const GET_REGISTRY = 'GET_REGISTRY';

/**
 * Collects and combines multiple objects of similar shape.
 *
 * Used to combine objects like actions, selectors, etc. for a data
 * store while ensuring no keys/action names/selector names are duplicated.
 *
 * Effectively this is an object spread, but throws an error if keys are
 * duplicated.
 *
 * @since 1.5.0
 * @private
 *
 * @param {...Object} items A list of arguments, each one should be an object to combine into one.
 * @return {Object} The combined object.
 */
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

/**
 * Collects all actions.
 *
 * @since 1.5.0
 *
 * @param {...Object} args A list of objects, each containing their own actions.
 * @return {Object} The combined object.
 */
export const collectActions = collect;

/**
 * Collects all controls.
 *
 * @since 1.5.0
 *
 * @param {...Object} args A list of objects, each containing their own controls.
 * @return {Object} The combined object.
 */
export const collectControls = collect;

/**
 * Collects all reducers and (optionally) provides initial state.
 *
 * If the first argument passed is not a function, it will be used as the
 * combined reducer's `initialState`.
 *
 * @since 1.5.0
 *
 * @param {...(Object|Function)} args A list of reducers, each containing their own controls. If the first argument is not a function, it will be used as the combined reducer's `initialState`.
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

/**
 * Collects all resolvers.
 *
 * @since 1.5.0
 *
 * @param {...Object} args A list of objects, each containing their own resolvers.
 * @return {Object} The combined object.
 */
export const collectResolvers = collect;

/**
 * Collects all selectors.
 *
 * @since 1.5.0
 *
 * @param {...Object} args A list of objects, each containing their own selectors.
 * @return {Object} The combined object.
 */
export const collectSelectors = collect;

/**
 * Collects all state values.
 *
 * @since 1.5.0
 *
 * @param {...Object} args A list of objects, each containing their own state values.
 * @return {Object} The combined object.
 */
export const collectState = collect;

/**
 * Collects all store names.
 *
 * This function's main purpose is to ensure generated store names for a single store match.
 *
 * @since 1.6.0
 *
 * @param {...string} args A list of store names, all of which must be equal.
 * @return {string} The single store name.
 */
export const collectName = ( ...args ) => {
	const names = [ ...args ];

	const duplicates = findDuplicates( names );
	invariant( duplicates.length === names.length - 1, 'collectName() must not receive different names.' );

	return names.shift();
};

/**
 * Passes through state unmodified; eg. an empty reducer.
 *
 * @since 1.8.0
 * @private
 *
 * @param {Object} state A store's state.
 * @return {Object} The same state data as passed in `state`.
 */
const passthroughReducer = ( state ) => state;

/**
 * Combines multiple stores.
 *
 * @since 1.8.0
 *
 * @param {...Object} stores A list of objects, each a store containing one or more of the following keys: initialState, actions, controls, reducer, resolvers, selectors.
 * @return {Object} The combined store.
 */
export const combineStores = ( ...stores ) => {
	const combinedInitialState = collectState(
		...stores.map( ( store ) => ( store.initialState || {} ) )
	);

	return {
		initialState: combinedInitialState,
		controls: collectControls(
			...stores.map( ( store ) => ( store.controls || {} ) )
		),
		actions: collectActions(
			...stores.map( ( store ) => ( store.actions || {} ) )
		),
		reducer: collectReducers(
			combinedInitialState,
			...stores.map( ( store ) => ( store.reducer || passthroughReducer ) )
		),
		resolvers: collectResolvers(
			...stores.map( ( store ) => ( store.resolvers || {} ) )
		),
		selectors: collectSelectors(
			...stores.map( ( store ) => ( store.selectors || {} ) )
		),
	};
};

/**
 * An object of common actions most stores will use.
 *
 * @since 1.7.0
 *
 * @return {Object} Key/value list of common actions most stores will want.
 */
export const commonActions = {
	/**
	 * Dispatches an action and calls a control to get the current data registry.
	 *
	 * Useful for controls and resolvers that wish to dispatch actions/use selectors
	 * on the current data registry.
	 *
	 * @since 1.7.0
	 *
	 * @return {Object} FSA-compatible action.
	 */
	getRegistry() {
		return {
			payload: {},
			type: GET_REGISTRY,
		};
	},
};

/**
 * An object of common controls most stores will use.
 *
 * @since 1.7.0
 *
 * @return {Object} Key/value list of common controls most stores will want.
 */
export const commonControls = {
	/**
	 * Returns the current registry.
	 *
	 * Useful for controls and resolvers that wish to dispatch actions/use selectors
	 * on the current data registry.
	 *
	 * @since 1.7.0
	 *
	 * @return {Object} FSA-compatible action.
	 */
	[ GET_REGISTRY ]: createRegistryControl( ( registry ) => () => registry ),
};

/**
 * Finds all duplicate items in an array and return them.
 *
 * @since 1.5.0
 * @private
 *
 * @param {Array} array Any array.
 * @return {Array} All values in the input array that were duplicated.
 */
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

/**
 * A store containing the common actions, controls and reducer that all stores will use.
 *
 * @since 1.8.0
 *
 * @return {Object} Object with common actions, controls and reducer.
 */
export const commonStore = {
	actions: commonActions,
	controls: commonControls,
	reducer: passthroughReducer,
};
