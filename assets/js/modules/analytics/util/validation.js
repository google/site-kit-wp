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
import {
	ACCOUNT_CREATE,
	PROPERTY_CREATE,
	PROFILE_CREATE,
} from '../datastore/constants';

/**
 * Checks the given value to see if it is a positive integer.
 *
 * @since 1.8.0
 *
 * @param {*} input Value to check.
 * @return {boolean} Validity.
 */
const isValidNumericID = function ( input ) {
	const id = parseInt( input, 10 ) || 0;

	return id > 0;
};

/**
 * Checks if the given account ID appears to be a valid Analytics account.
 *
 * @since 1.8.0
 *
 * @param {(string|number)} accountID Account ID to test.
 * @return {boolean} Whether or not the given account ID is valid.
 */
export { isValidNumericID as isValidAccountID };

/**
 * Checks if the given value is a valid selection for an Account.
 *
 * @since 1.8.0
 *
 * @param {?string} value Selected value.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidAccountSelection( value ) {
	if ( value === ACCOUNT_CREATE ) {
		return true;
	}

	return isValidNumericID( value );
}

/**
 * Checks whether the given property ID appears to be valid.
 *
 * @since 1.8.0
 *
 * @param {*} propertyID Property ID to check.
 * @return {boolean} Whether or not the given property ID is valid.
 */
export function isValidPropertyID( propertyID ) {
	return typeof propertyID === 'string' && /^UA-\d+-\d+$/.test( propertyID );
}

/**
 * Checks if the given value is a valid selection for a Property.
 *
 * @since 1.8.0
 *
 * @param {?string} value Selected value.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidPropertySelection( value ) {
	if ( value === PROPERTY_CREATE ) {
		return true;
	}

	return isValidPropertyID( value );
}

/**
 * Checks if the given profile ID appears to be valid.
 *
 * @since 1.8.0
 *
 * @param {(string|number)} accountID Account ID to test.
 * @return {boolean} Whether or not the given account ID is valid.
 */
export { isValidNumericID as isValidProfileID };

/**
 * Checks if the given value is a valid selection for a Profile.
 *
 * @since 1.8.0
 *
 * @param {string} value Selected value.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidProfileSelection( value ) {
	if ( value === PROFILE_CREATE ) {
		return true;
	}

	return isValidNumericID( value );
}

/**
 * Checks if the given profile name appears to be valid.
 *
 * @since 1.11.0
 *
 * @param {string} value Profile name to test.
 * @return {boolean} True if valid, otherwise false.
 */
export function isValidProfileName( value ) {
	return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if the given internal web property ID appears to be valid.
 *
 * @since 1.8.0
 *
 * @param {(string|number)} accountID Account ID to test.
 * @return {boolean} Whether or not the given account ID is valid.
 */
export { isValidNumericID as isValidInternalWebPropertyID };

/**
 * Checks if the given ads conversion ID is valid.
 *
 * @since 1.32.0
 *
 * @param {*} value Conversion ID to test.
 * @return {boolean} Whether or not the given ID is valid.
 */
export function isValidAdsConversionID( value ) {
	return typeof value === 'string' && /^AW-[0-9]+$/.test( value );
}
