/**
 * Reader Revenue Manager test utilities.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';

/**
 * Provides publications to the given registry.
 *
 * @since 1.187.0
 * @private
 *
 * @param {Registry|WPDataRegistry} registry     Data registry.
 * @param {Publication[]}           publications Publications list.
 * @return {void}
 */
export function providePublications(
	registry: Registry | WPDataRegistry,
	publications: Publication[]
) {
	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.receiveGetPublications( publications );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.finishResolution( 'getPublications', [] );
}

export function providePublication(
	registry: Registry | WPDataRegistry,
	publication: Publication
) {
	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
		/* eslint-disable sitekit/acronym-case */
		organizationID: publication.organizationId,
		publicationID: publication.publicationId,
		/* eslint-enable sitekit/acronym-case */
	} );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.finishResolution( 'getSettings', [] );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.receiveGetPublication( publication );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.finishResolution( 'getPublication', [] );
}
