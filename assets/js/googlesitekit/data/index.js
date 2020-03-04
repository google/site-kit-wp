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
import { collect, collectReducers } from 'assets/js/googlesitekit/data/utils';

const siteKitRegistry = createRegistry();

// Attach some of our utility functions to the registry so third-party
// developers can use them.
siteKitRegistry.collect = collect;
siteKitRegistry.collectReducers = collectReducers;

export default siteKitRegistry;
