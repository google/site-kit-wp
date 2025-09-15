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

// PII types for classification.
export const PII_TYPE = {
	EMAIL: 'email',
	PHONE: 'phone',
	NAME: 'name',
};

// Indicators for identifying PII fields.
export const PII_INDICATORS = {
	[ PII_TYPE.EMAIL ]: [ 'email', 'e-mail', 'mail', 'email address' ],
	[ PII_TYPE.PHONE ]: [
		'phone',
		'tel',
		'mobile',
		'cell',
		'telephone',
		'phone number',
	],
	[ PII_TYPE.NAME ]: [
		'name',
		'full-name',
		'full name',
		'full_name',
		'fullname',
		'first-name',
		'first name',
		'first_name',
		'firstname',
		'last-name',
		'last name',
		'last_name',
		'lastname',
		'given-name',
		'given name',
		'given_name',
		'givenname',
		'family-name',
		'family name',
		'family_name',
		'familyname',
		'fname',
		'lname',
		'first',
		'last',
		'your-name',
		'your name',
	],
};

const PHONE_MIN_DIGIT_COUNT = 7;

/**
 * Normalizes a value for use in conversion tracking.
 *
 * @since 1.161.0
 *
 * @param {string} value The value to normalize.
 * @return {string} The normalized value.
 */
export function normalizeValue( value ) {
	if ( ! value || typeof value !== 'string' ) {
		return '';
	}

	return value.trim().toLowerCase();
}

/**
 * Normalizes a label by removing common form suffixes and prefixes.
 *
 * @since n.e.x.t
 *
 * @param {string} label The label to normalize.
 * @return {string} The normalized label.
 */
export function normalizeLabel( label ) {
	if ( ! label || typeof label !== 'string' ) {
		return '';
	}

	return (
		label
			.trim()
			.toLowerCase()
			// Remove common required field indicators
			.replace( /\s*\*+\s*$/, '' ) // "Name *" → "Name"
			.replace( /\s*\(required\)\s*$/i, '' ) // "Name (Required)" → "Name"
			.replace( /\s*:\s*$/, '' ) // "Name:" → "Name"
			.trim()
	);
}

/**
 * Normalizes an email address for conversion tracking.
 *
 * @since 1.161.0
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
 * Determines if a string has a phone-like pattern.
 *
 * @since n.e.x.t
 *
 * @param {string} value The string to validate.
 * @return {boolean} Whether the string passed has a phone-like pattern or not.
 */
export function hasPhoneLikePattern( value ) {
	const digits = value.replace( /\D/g, '' );

	if (
		digits.length < PHONE_MIN_DIGIT_COUNT ||
		digits.length < value.length / 2
	) {
		return false;
	}

	// Ensure the string only contains digits and phone-like separators, such as spaces, dashes, parentheses, plus signs, and dots.
	return /^[\s\-()+.\d]*$/.test( value );
}

/**
 * Normalizes a phone number for conversion tracking.
 *
 * @since 1.161.0
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
 * @since 1.161.0
 *
 * @param {string} value The value to check.
 * @return {boolean} True if the value is likely an email address, false otherwise.
 */
export function isLikelyEmail( value ) {
	if ( ! value ) {
		return false;
	}

	const normalizedEmail = normalizeEmail( value );

	const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	return emailPattern.test( normalizedEmail );
}

/**
 * Checks if a value is likely a phone number.
 *
 * @since 1.161.0
 *
 * @param {string} value The value to check.
 * @return {boolean} True if the value is likely a phone number, false otherwise.
 */
export function isLikelyPhone( value ) {
	if ( ! value ) {
		return false;
	}

	if ( ! hasPhoneLikePattern( value ) ) {
		return false;
	}

	const normalizedPhone = normalizePhone( value );

	const phonePattern = /^\+?\d{7,}$/;

	return phonePattern.test( normalizedPhone );
}

/**
 * Classifies a field as PII based on its metadata.
 *
 * @since 1.161.0
 *
 * @param {Object} fieldMeta The metadata of the field to classify.
 * @return {Object|null} An object containing the PII type and value, or null if not classified.
 */
export function classifyPII( fieldMeta ) {
	let { type, name, value, label } = fieldMeta || {};

	type = normalizeValue( type );
	name = normalizeValue( name );
	value = normalizeValue( value );
	label = normalizeLabel( label );

	switch ( type ) {
		case 'email':
			return {
				type: PII_TYPE.EMAIL,
				value: normalizeEmail( value ),
			};
		case 'tel':
			return {
				type: PII_TYPE.PHONE,
				value: normalizePhone( value ),
			};
	}

	if ( isLikelyEmail( value ) ) {
		return {
			type: PII_TYPE.EMAIL,
			value: normalizeEmail( value ),
		};
	}

	if ( isLikelyPhone( value ) ) {
		return {
			type: PII_TYPE.PHONE,
			value: normalizePhone( value ),
		};
	}

	if (
		PII_INDICATORS[ PII_TYPE.EMAIL ].includes( name ) ||
		PII_INDICATORS[ PII_TYPE.EMAIL ].includes( label )
	) {
		return {
			type: PII_TYPE.EMAIL,
			value: normalizeEmail( value ),
		};
	}

	if (
		PII_INDICATORS[ PII_TYPE.PHONE ].includes( name ) ||
		PII_INDICATORS[ PII_TYPE.PHONE ].includes( label )
	) {
		return {
			type: PII_TYPE.PHONE,
			value: normalizePhone( value ),
		};
	}

	if (
		PII_INDICATORS[ PII_TYPE.NAME ].includes( name ) ||
		PII_INDICATORS[ PII_TYPE.NAME ].includes( label )
	) {
		return {
			type: PII_TYPE.NAME,
			value: normalizeValue( value ),
		};
	}

	return null;
}

/**
 * Extracts and formats name fields for Google Tag's user_data address object.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} fields An array of detected PII fields.
 * @return {Object|undefined} An object containing normalized first_name and optionally last_name, or undefined if no names found.
 */
export function getAddress( fields ) {
	const names = fields
		.filter( ( { type } ) => type === PII_TYPE.NAME )
		.map( ( { value } ) => value );

	if ( ! names.length ) {
		return undefined;
	}

	const [ firstName, ...lastNames ] =
		names.length === 1 ? names[ 0 ].split( ' ' ) : names;

	return {
		first_name: normalizeValue( firstName ),
		...( lastNames?.length > 0
			? { last_name: normalizeValue( lastNames.join( ' ' ) ) }
			: {} ),
	};
}

/**
 * Extracts the email address from detected PII fields.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} fields An array of detected PII fields.
 * @return {string|undefined} The email address if found, undefined otherwise.
 */
export function getEmail( fields ) {
	return fields.find( ( { type } ) => type === PII_TYPE.EMAIL )?.value;
}

/**
 * Extracts the phone number from detected PII fields.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} fields An array of detected PII fields.
 * @return {string|undefined} The phone number if found, undefined otherwise.
 */
export function getPhoneNumber( fields ) {
	return fields.find( ( { type } ) => type === PII_TYPE.PHONE )?.value;
}

/**
 * Extracts and classifies user data from a WPForms form submission.
 *
 * @since n.e.x.t
 *
 * @param {Array<Object>} fields An array of detected PII fields.
 * @return {Object|undefined} A user_data object containing detected PII (address, email, phone_number), or undefined if no PII found.
 */
export function getUserData( fields ) {
	const userDataFields = [
		[ 'address', getAddress( fields ) ],
		[ 'email', getEmail( fields ) ],
		[ 'phone_number', getPhoneNumber( fields ) ],
	].filter( ( [ , value ] ) => value );

	if ( userDataFields.length === 0 ) {
		return undefined;
	}

	return Object.fromEntries( userDataFields );
}
