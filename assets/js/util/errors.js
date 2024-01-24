/**
 * Error Utilities.
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
 * External dependencies
 */
import { isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

// Error codes and reasons.
export const ERROR_CODE_MISSING_REQUIRED_SCOPE = 'missing_required_scopes'; // When scopes are missing.
export const ERROR_REASON_INSUFFICIENT_PERMISSIONS = 'insufficientPermissions';
export const ERROR_REASON_FORBIDDEN = 'forbidden';
export const ERROR_INTERNAL_SERVER_ERROR = 'internal_server_error';
export const ERROR_INVALID_JSON = 'invalid_json';
export const ERROR_REASON_BAD_REQUEST = 'bad_request';

/**
 * Checks if the provided object is an instance of WP_Error class.
 *
 * @since 1.13.0
 *
 * @param {Object} obj The object to check.
 * @return {boolean} TRUE if the object has "code", "data" and "message" properties, otherwise FALSE.
 */
export function isWPError( obj ) {
	return (
		isPlainObject( obj ) &&
		obj.hasOwnProperty( 'code' ) &&
		( typeof obj.code === 'string' || typeof obj.code === 'number' ) &&
		obj.hasOwnProperty( 'message' ) &&
		typeof obj.message === 'string' &&
		obj.hasOwnProperty( 'data' )
	); // We don't check "obj.data" type because it can be anything.
}

/**
 * Checks if the given error is a permission scope error.
 *
 * @since 1.9.0
 * @private
 *
 * @param {Object} error Input to test as a possible permission scope error.
 * @return {boolean} TRUE if permission scope error, otherwise FALSE.
 */
export function isPermissionScopeError( error ) {
	return error?.code === ERROR_CODE_MISSING_REQUIRED_SCOPE;
}

/**
 * Checks if the given error has insufficient permissions reason.
 *
 * @since 1.16.0
 * @since 1.70.0 Add support for "forbidden" reason.
 *
 * @param {Object} error The error object to check.
 * @return {boolean} TRUE if it's insufficient permissions error, otherwise FALSE.
 */
export function isInsufficientPermissionsError( error ) {
	return [
		ERROR_REASON_INSUFFICIENT_PERMISSIONS,
		ERROR_REASON_FORBIDDEN,
	].includes( error?.data?.reason );
}

/**
 * Checks if the given error is an auth error.
 *
 * @since 1.78.0
 *
 * @param {Object} error The error object to check.
 * @return {boolean} TRUE if it's an auth error, otherwise FALSE.
 */
export function isAuthError( error ) {
	return !! error?.data?.reconnectURL;
}

/**
 * Checks if the given error can be retried.
 *
 * @since 1.86.0
 *
 * @param {Object} error          The error object to check.
 * @param {Object} [selectorData] The error's associated selector data object.
 * @return {boolean} TRUE if the error is retryable, otherwise FALSE.
 */
export function isErrorRetryable( error, selectorData ) {
	return (
		!! selectorData?.storeName &&
		! isInsufficientPermissionsError( error ) &&
		! isPermissionScopeError( error ) &&
		! isAuthError( error )
	);
}

/**
 * Sets the error message for specific error codes.
 *
 * @since 1.92.0
 *
 * @param {Object} error The error object to check.
 * @return {Object} The updated error object.
 */
export function getReportErrorMessage( error ) {
	if ( error?.code === ERROR_INTERNAL_SERVER_ERROR ) {
		return __(
			'There was a critical error on this website while fetching data',
			'google-site-kit'
		);
	} else if ( error?.code === ERROR_INVALID_JSON ) {
		return __(
			'The server provided an invalid response',
			'google-site-kit'
		);
	}

	return error?.message;
}
