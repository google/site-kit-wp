/**
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';

/**
 * Requires that the current user has the given scope.
 *
 * @since n.e.x.t
 *
 * @param {string} scope Scope to check.
 * @return {boolean} Whether the current user has the given scope.
 */
export function requireScope( scope ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getAuthentication();

		return select( CORE_USER ).hasScope( scope );
	};
}

/**
 * Requires that the current user is authenticated.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether or not the current user is authenticated.
 */
export function requireIsAuthenticated() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getAuthentication();

		return true === select( CORE_USER ).isAuthenticated();
	};
}

/**
 * Requires that the current user can view the given shared module.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Module slug to test.
 * @return {boolean} Whether the current user can view the given shared module.
 */
export function requireCanViewSharedModule( slug ) {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getCapabilities();

		return select( CORE_USER ).canViewSharedModule( slug );
	};
}

/**
 * Requires that the given module is connected.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Module slug to test.
 * @return {boolean} Whether the given module is connected or not.
 */
export function requireModuleConnected( slug ) {
	return async function ( { resolveSelect } ) {
		return (
			true ===
			( await resolveSelect( CORE_MODULES ).isModuleConnected( slug ) )
		);
	};
}

/**
 * Requires that the current user is the owner of the given module.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Module slug to test.
 * @return {boolean} Whether the given module is owned by the current user or not.
 */
export function requireModuleOwnership( slug ) {
	return async ( { resolveSelect } ) =>
		true ===
		( await resolveSelect( CORE_MODULES ).hasModuleOwnership( slug ) );
}

/**
 * Requires that the current user has access to the given module.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Module slug to test.
 * @return {boolean} Whether the current user has access to the given module or not.
 */
export function requireModuleAccess( slug ) {
	return async ( { resolveSelect } ) =>
		true ===
		( await resolveSelect( CORE_MODULES ).hasModuleAccess( slug ) );
}

/**
 * Requires that the given item is dismissed.
 *
 * @since n.e.x.t
 *
 * @param {string} item Dismissible item ID.
 * @return {boolean} Whether the given item is dismissed or not.
 */
export function requireItemDismissed( item ) {
	return async ( { resolveSelect } ) =>
		true === ( await resolveSelect( CORE_USER ).isItemDismissed( item ) );
}

/**
 * Requires that the audience segmentation widget is hidden.
 *
 * @since n.e.x.t
 *
 * @return {boolean} Whether the widget is hidden or not.
 */
export function requireAudienceSegmentationWidgetHidden() {
	return async ( { select, resolveSelect } ) => {
		await resolveSelect( CORE_USER ).getUserAudienceSettings();

		return (
			true === select( CORE_USER ).isAudienceSegmentationWidgetHidden()
		);
	};
}
