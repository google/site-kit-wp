/**
 * Utilities for conversion tracking event providers.
 *
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
 * Normalizes a value for use in conversion tracking.
 *
 * @since n.e.x.t
 *
 * @param {string} value The value to normalize.
 * @return {string} The normalized value.
 */
export function normalizeValue( value = '' ) {
	return value.trim().toLowerCase();
}

/**
 * Normalizes an email address for conversion tracking.
 *
 * @since n.e.x.t
 *
 * @param {string} email The email address to normalize.
 * @return {string} The normalized email address.
 */
export function normalizeEmail( email ) {
	const normalizedEmail = normalizeValue( email );

	const atIndex = normalizedEmail.lastIndexOf( '@' );

	// If there is no '@' in the email, return it as is.
	if ( atIndex === -1 ) {
		return normalizedEmail;
	}

	const domain = normalizedEmail.slice( atIndex + 1 );

	// Check if it is a 'gmail.com' or 'googlemail.com' address.
	if ( [ 'gmail.com', 'googlemail.com' ].includes( domain ) ) {
		const prefix = normalizedEmail.slice( 0, atIndex );

		// Remove dots from the prefix.
		const normalizedPrefix = prefix.replace( /\./g, '' );

		return `${ normalizedPrefix }@${ domain }`;
	}

	return normalizedEmail;
}

/**
 * Normalizes a phone number for conversion tracking.
 *
 * @since n.e.x.t
 *
 * @param {string} phone The phone number to normalize.
 * @return {string} The normalized phone number.
 */
export function normalizePhone( phone ) {
	const normalizedPhone = normalizeValue( phone );

	// Remove all non-numeric characters.
	const digits = normalizedPhone.replace( /\D/g, '' );

	// If the phone number starts with a '+' sign, keep it.
	if ( normalizedPhone.startsWith( '+' ) ) {
		return `+${ digits }`;
	}

	return digits;
}

/**
 * Checks if a value is likely an email address.
 *
 * @since n.e.x.t
 *
 * @param {string} value The value to check.
 * @return {boolean} True if the value is likely an email address, false otherwise.
 */
export function isLikelyEmail( value ) {
	const normalizedEmail = normalizeEmail( value );

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	return emailPattern.test( normalizedEmail );
}
