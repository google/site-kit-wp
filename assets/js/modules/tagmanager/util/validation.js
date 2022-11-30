/**
 * Validation utilities.
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

/**
 * Internal dependencies
 */
import { isValidNumericID } from '../../../util';
import {
	ACCOUNT_CREATE,
	CONTAINER_CREATE,
	CONTEXT_WEB,
	CONTEXT_AMP,
} from '../datastore/constants';
import { getNormalizedContainerName } from './container';

/**
 * Checks if the given account ID appears to be a valid Tag Manager account.
 *
 * @since 1.11.0
 *
 * @param {(string|number)} accountID Account ID to test.
 * @return {boolean} Whether or not the given account ID is valid.
 */
export function isValidAccountID( accountID ) {
	return isValidNumericID( accountID );
}

/**
 * Checks if the given value is a valid selection for an Account.
 *
 * @since 1.11.0
 *
 * @param {string} value Selected value.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidAccountSelection( value ) {
	if ( value === ACCOUNT_CREATE ) {
		return true;
	}

	return isValidAccountID( value );
}

/**
 * Checks if the given container ID appears to be a valid GTM container.
 *
 * @since 1.11.0
 *
 * @param {string} containerID Container ID to check.
 * @return {boolean} Whether or not the given container ID is valid.
 */
export function isValidContainerID( containerID ) {
	return (
		typeof containerID === 'string' && /^GTM-[A-Z0-9]+$/.test( containerID )
	);
}

/**
 * Checks if the given container name appears to be valid.
 *
 * @since 1.20.0
 *
 * @param {string} containerName Container name to test.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidContainerName( containerName ) {
	return (
		typeof containerName === 'string' &&
		getNormalizedContainerName( containerName ).length > 0
	);
}

/**
 * Checks if the given container name is unique across account containers.
 *
 * @since 1.20.0
 *
 * @param {string}         containerName Container name to test.
 * @param {Array.<Object>} containers    Available containers.
 * @return {boolean} True if unique, otherwise false.
 */
export function isUniqueContainerName( containerName, containers ) {
	const normalizedContainerName = getNormalizedContainerName( containerName );
	return (
		! Array.isArray( containers ) ||
		! containers.some(
			( { name } ) =>
				getNormalizedContainerName( name ) === normalizedContainerName
		)
	);
}

/**
 * Checks if the given value is a valid selection for a container.
 *
 * @since 1.11.0
 *
 * @param {string} value Selected value.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidContainerSelection( value ) {
	if ( value === CONTAINER_CREATE ) {
		return true;
	}

	return isValidContainerID( value );
}

/**
 * Checks if the given internal container ID appears to be valid.
 *
 * @since 1.11.0
 *
 * @param {(string|number)} internalContainerID Internal container ID to test.
 * @return {boolean} Whether or not the given ID is valid.
 */
export function isValidInternalContainerID( internalContainerID ) {
	return isValidNumericID( internalContainerID );
}

/**
 * Checks if the given context is a valid container usage context.
 *
 * @since 1.11.0
 *
 * @param {string} context A usage context to check.
 * @return {boolean} Whether or not the given context is valid.
 */
export function isValidUsageContext( context ) {
	return [ CONTEXT_WEB, CONTEXT_AMP ].includes( context );
}
