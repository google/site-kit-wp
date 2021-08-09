/**
 * `isValidDateRange` utility.
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
 * Asserts whether a given dateRange string is valid or invalid.
 *
 * @since 1.18.0
 *
 * @param {string} dateRange Date string to be asserted against. Defaults to an empty string.
 * @return {boolean}          True if the given dateRange string is valid.
 */
export const isValidDateRange = ( dateRange = '' ) => {
	const parts = dateRange.split( '-' );

	return (
		parts.length === 3 &&
		parts[ 0 ] === 'last' &&
		! Number.isNaN( parts[ 1 ] ) &&
		! Number.isNaN( parseFloat( parts[ 1 ] ) ) &&
		parts[ 2 ] === 'days'
	);
};
