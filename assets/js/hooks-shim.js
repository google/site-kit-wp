/**
 * WordPress dependencies
 */
import { createHooks } from '@wordpress/hooks__non-shim';

if ( global._GoogleSiteKitHooks === undefined ) {
	global._GoogleSiteKitHooks = createHooks();
}

export const {
	actions,
	filters,
	addAction,
	addFilter,
	removeAction,
	removeFilter,
	hasAction,
	hasFilter,
	removeAllActions,
	removeAllFilters,
	doAction,
	applyFilters,
	currentAction,
	currentFilter,
	doingAction,
	doingFilter,
	didAction,
	didFilter,
} = global._GoogleSiteKitHooks;

export default global._GoogleSiteKitHooks;
