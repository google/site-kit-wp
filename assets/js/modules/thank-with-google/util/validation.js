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
	BUTTON_PLACEMENT_DYNAMIC_HIGH,
	BUTTON_PLACEMENT_DYNAMIC_LOW,
	BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT,
	BUTTON_PLACEMENT_STATIC_AUTO,
	BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
	BUTTON_PLACEMENT_STATIC_BELOW_CONTENT,
} from '../datastore/constants';
import { getColorThemes } from './settings';

/**
 * Checks if the given publication ID appears to be a valid.
 *
 * @since 1.78.0
 *
 * @param {string} publicationID Publication ID to test.
 * @return {boolean} `true` if the given publication ID is valid, `false` otherwise.
 */
export function isValidPublicationID( publicationID ) {
	return (
		typeof publicationID === 'string' &&
		/^[A-Za-z0-9_.-]+$/.test( publicationID )
	);
}

/**
 * Checks if the given color theme is valid.
 *
 * @since 1.78.0
 *
 * @param {string} colorTheme Color theme to test.
 * @return {boolean} `true` if the given color theme is valid, `false` otherwise.
 */
export function isValidColorTheme( colorTheme ) {
	const validColorThemes = getColorThemes();
	return validColorThemes.some(
		( { colorThemeID } ) => colorThemeID === colorTheme
	);
}

/**
 * Checks if the given cta placement is valid.
 *
 * @since 1.78.0
 *
 * @param {string} ctaPlacement Button placement to test.
 * @return {boolean} `true` if the given button placement is valid, `false` otherwise.
 */
export function isValidCTAPlacement( ctaPlacement ) {
	return [
		BUTTON_PLACEMENT_DYNAMIC_HIGH,
		BUTTON_PLACEMENT_DYNAMIC_LOW,
		BUTTON_PLACEMENT_STATIC_AUTO,
		BUTTON_PLACEMENT_STATIC_ABOVE_CONTENT,
		BUTTON_PLACEMENT_STATIC_BELOW_CONTENT,
		BUTTON_PLACEMENT_STATIC_BELOW_1ST_PARAGRAPH,
	].includes( ctaPlacement );
}

/**
 * Checks if the given ctaPostTypes array is valid.
 *
 * @since 1.78.0
 *
 * @param {string[]} ctaPostTypes Button post types to test.
 * @return {boolean} `true` if the given button post types list is valid, `false` otherwise.
 */
export function isValidCTAPostTypes( ctaPostTypes ) {
	return (
		Array.isArray( ctaPostTypes ) &&
		ctaPostTypes.length >= 1 &&
		ctaPostTypes.every( ( buttonPostType ) => buttonPostType.length > 0 )
	);
}
