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

const siteKitRegistry = createRegistry();

// Attach some of our utility functions to the registry so third-party
// developers can use them.
siteKitRegistry.collectActions = collectActions;
siteKitRegistry.collectControls = collectControls;
siteKitRegistry.collectReducers = collectReducers;
siteKitRegistry.collectResolvers = collectResolvers;
siteKitRegistry.collectSelectors = collectSelectors;
siteKitRegistry.collectState = collectState;
siteKitRegistry.collectReducers = collectReducers;

export default siteKitRegistry;
