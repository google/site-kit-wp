/**
 * Container utilities.
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
import { unescape } from 'lodash';

/**
 * Gets normalized container name.
 *
 * @since 1.20.0
 *
 * @param {string} containerName Container name to normalize.
 * @return {string} Normalized container name.
 */
export function getNormalizedContainerName( containerName ) {
	let sanitizedContainerName = containerName;

	// Decode html entities.
	sanitizedContainerName = unescape( sanitizedContainerName );
	// Remove any leading or trailing whitespace.
	sanitizedContainerName = sanitizedContainerName.trim();
	// Must not start with an underscore.
	sanitizedContainerName = sanitizedContainerName.replace( /^_+/, '' );
	// Convert accents to basic characters to prevent them from being stripped.
	sanitizedContainerName = sanitizedContainerName
		.normalize( 'NFD' )
		.replace( /[\u0300-\u036f]/g, '' );
	// Strip all non-simple characters.
	sanitizedContainerName = sanitizedContainerName.replace(
		/[^a-zA-Z0-9_., -]/g,
		''
	);
	// Collapse multiple whitespaces.
	sanitizedContainerName = sanitizedContainerName.replace( /\s+/g, ' ' );

	return sanitizedContainerName;
}
