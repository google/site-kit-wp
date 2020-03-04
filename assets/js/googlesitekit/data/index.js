/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { createRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	collectActions,
	collectControls,
	collectReducers,
	collectResolvers,
	collectSelectors,
	collectState,
} from 'assets/js/googlesitekit/data/utils';

const Data = createRegistry();

// Attach some of our utility functions to the registry so third-party
// developers can use them.
Data.collectActions = collectActions;
Data.collectControls = collectControls;
Data.collectReducers = collectReducers;
Data.collectResolvers = collectResolvers;
Data.collectSelectors = collectSelectors;
Data.collectState = collectState;
Data.collectReducers = collectReducers;

export default Data;
