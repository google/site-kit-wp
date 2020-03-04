/**
 * External dependencies
 */
import invariant from 'invariant';

const INITIALIZE = 'INITIALIZE';

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

export const initializeAction = () => {
	return {
		payload: {},
		type: INITIALIZE,
	};
};

export const collectActions = ( ...args ) => {
	return collect( ...args, {
		initialize: initializeAction,
	} );
};

export const collectControls = collect;

export const collectReducers = ( initialState, reducers ) => {
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

	return ( state = initialState, action ) => {
		return [ ...reducers, initializeReducer ].reduce( ( newState, reducer ) => {
			return reducer( newState, action );
		}, state );
	};
};

export const collectResolvers = collect;

export const collectSelectors = collect;

export const collectState = collect;

function findDuplicates( array ) {
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
}
