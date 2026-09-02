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

export interface ErrorObject {
	code?: string | number;
	message?: string;
	data?: {
		reason?: string;
		reconnectURL?: string;
		[ key: string ]: unknown;
	};
}

interface SelectorData {
	storeName?: string;
	name?: string;
}

/**
 * Checks if the provided object is an instance of WP_Error class.
 *
 * @since 1.13.0
 *
 * @param {Object} obj The object to check.
 * @return {boolean} TRUE if the object has "code", "data" and "message" properties, otherwise FALSE.
 */
export function isWPError( obj: unknown ): obj is ErrorObject {
	const candidate = obj as ErrorObject;

	return (
		isPlainObject( obj ) &&
		candidate.hasOwnProperty( 'code' ) &&
		( typeof candidate.code === 'string' ||
			typeof candidate.code === 'number' ) &&
		candidate.hasOwnProperty( 'message' ) &&
		typeof candidate.message === 'string' &&
		candidate.hasOwnProperty( 'data' )
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
export function isPermissionScopeError( error: unknown ): boolean {
	return ( error as ErrorObject )?.code === ERROR_CODE_MISSING_REQUIRED_SCOPE;
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
export function isInsufficientPermissionsError( error: unknown ): boolean {
	return [
		ERROR_REASON_INSUFFICIENT_PERMISSIONS,
		ERROR_REASON_FORBIDDEN,
	].includes( ( error as ErrorObject )?.data?.reason as string );
}

/**
 * Checks if the given error is an auth error.
 *
 * @since 1.78.0
 *
 * @param {Object} error The error object to check.
 * @return {boolean} TRUE if it's an auth error, otherwise FALSE.
 */
export function isAuthError( error: unknown ): boolean {
	return !! ( error as ErrorObject )?.data?.reconnectURL;
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
export function isErrorRetryable(
	error: unknown,
	selectorData?: SelectorData
): boolean {
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
export function getReportErrorMessage( error: unknown ): string | undefined {
	const errorObject = error as ErrorObject;

	if ( errorObject?.code === ERROR_INTERNAL_SERVER_ERROR ) {
		return __(
			'There was a critical error on this website while fetching data',
			'google-site-kit'
		);
	} else if ( errorObject?.code === ERROR_INVALID_JSON ) {
		return __(
			'The server provided an invalid response',
			'google-site-kit'
		);
	}

	return errorObject?.message;
}
