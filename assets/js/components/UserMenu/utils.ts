/**
 * UserMenu utilities.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Returns the account label for the user menu.
 *
 * @since 1.179.0
 *
 * @param {string|undefined} userFullName User's full name.
 * @param {string|undefined} userEmail    User's email address.
 * @return {string|undefined} Localized account label.
 */
export function getAccountLabel(
	userFullName?: string,
	userEmail?: string
): string | undefined {
	if ( userFullName && userEmail ) {
		return sprintf(
			/* translators: Account info text. 1: User's (full) name 2: User's email address. */
			__( 'Google Account for %1$s (Email: %2$s)', 'google-site-kit' ),
			userFullName,
			userEmail
		);
	}

	if ( userFullName && ! userEmail ) {
		return sprintf(
			/* translators: Account info text. 1: User's (full) name. */
			__( 'Google Account for %1$s', 'google-site-kit' ),
			userFullName
		);
	}

	if ( ! userFullName && userEmail ) {
		return sprintf(
			/* translators: Account info text. 1: User's email address. */
			__( 'Google Account (Email: %1$s)', 'google-site-kit' ),
			userEmail
		);
	}

	return undefined;
}
