/**
 * Validation utilities.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Checks if the given conversion ID is valid.
 *
 * @since 1.32.0
 * @since 1.121.0 Migrated from analytics to analytics-4.
 * @since 1.124.0 Migrated from analytics-4 to ads.
 *
 * @param {*} value Ads Conversion Tracking ID to test.
 * @return {boolean} Whether or not the given ID is valid.
 */
export function isValidConversionID( value ) {
	return (
		typeof value === 'string' && value !== '' && /^AW-[0-9]+$/.test( value )
	);
}

/**
 * Checks if the given paxConversionID ID is valid.
 *
 * @since 1.126.0
 *
 * @param {*} value Ads Conversion Tracking ID to test.
 * @return {boolean} Whether or not the given ID is valid.
 */
export function isValidPaxConversionID( value ) {
	return (
		typeof value === 'string' && value !== '' && /^AW-[0-9]+$/.test( value )
	);
}

/**
 * Checks if the given extCustomerID ID is valid.
 *
 * @since 1.126.0
 *
 * @param {*} value PAX external customer ID to test.
 * @return {boolean} Whether or not the given ID is valid.
 */
export function isValidExtCustomerID( value ) {
	return typeof value === 'string';
}
