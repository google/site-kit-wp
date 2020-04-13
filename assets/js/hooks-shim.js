/**
 * WordPress Hooks API.
 *
 * A temporary workaround to share the same instance of hooks
 * across multiple entrypoints.
 *
 * @private
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
import * as hooks from '@wordpress/hooks__non-shim';

if ( global.googlesitekit === undefined ) {
	global.googlesitekit = {};
}

const {
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
	actions,
	filters,
} = global.googlesitekit._hooks || hooks;
// Ensure exports always reference the same instance.

export {
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
	actions,
	filters,
};

if ( global.googlesitekit._hooks === undefined ) {
	global.googlesitekit._hooks = {
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
		actions,
		filters,
	};
}
