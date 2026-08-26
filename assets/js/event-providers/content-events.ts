/**
 * Content events provider.
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
 * Internal dependencies
 */
import { initializePagination } from './content-events/pagination';
import { initializeVimeo } from './content-events/vimeo';

export interface ContentEventsConfig {
	postID: number;
	isSinglePost: boolean;
	hasVimeoEmbed: boolean;
}

/**
 * Gets the Content Events configuration.
 *
 * @since 1.186.0
 *
 * @return {ContentEventsConfig} Content events configuration object.
 */
export function getContentEventsConfig(): ContentEventsConfig {
	return {
		postID: 0,
		isSinglePost: false,
		hasVimeoEmbed: false,
		...( global._googlesitekit?.contentEvents || {} ),
	};
}

initializeVimeo( getContentEventsConfig() );

try {
	initializePagination( getContentEventsConfig() );
} catch ( error ) {
	// eslint-disable-next-line no-console
	console.error(
		'Site Kit: failed to initialize pagination click tracking.',
		error
	);
}
