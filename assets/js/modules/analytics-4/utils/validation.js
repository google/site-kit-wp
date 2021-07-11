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
import { PROPERTY_CREATE, WEBDATASTREAM_CREATE } from '../datastore/constants';

/**
 * Checks whether the given property ID appears to be valid.
 *
 * @since 1.31.0
 *
 * @param {*} propertyID Property ID to check.
 * @return {boolean} Whether or not the given property ID is valid.
 */
export function isValidPropertyID( propertyID ) {
	return typeof propertyID === 'string' && /^\w+$/.test( propertyID );
}

/**
 * Checks if the given value is a valid selection for a Property.
 *
 * @since 1.31.0
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
 * Checks whether the given web data stream ID appears to be valid.
 *
 * @since 1.33.0
 *
 * @param {*} webDataStreamID Web data stream ID to check.
 * @return {boolean} TRUE if the web data stream ID is valid, otherwise FALSE.
 */
export function isValidWebDataStreamID( webDataStreamID ) {
	return typeof webDataStreamID === 'string' && /^\d+$/.test( webDataStreamID );
}

/**
 * Checks whether the given web data stream is a valid selection.
 *
 * @since 1.35.0
 *
 * @param {?string} webDataStreamID Web data stream to check.
 * @return {boolean} TRUE if the web data stream selection is valid, otherwise FALSE.
 */
export function isValidWebDataStreamSelection( webDataStreamID ) {
	if ( webDataStreamID === WEBDATASTREAM_CREATE ) {
		return true;
	}

	return isValidWebDataStreamID( webDataStreamID );
}

/**
 * Checks whether the given measurementID appears to be valid.
 *
 * @since 1.35.0
 *
 * @param {*} measurementID Web data stream measurementID to check.
 * @return {boolean} TRUE if the measurementID is valid, otherwise FALSE.
 */
export function isValidMeasurementID( measurementID ) {
	return typeof measurementID === 'string' && /^G-[a-zA-Z0-9]+$/.test( measurementID );
}
