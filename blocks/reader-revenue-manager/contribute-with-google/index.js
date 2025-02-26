/**
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
import { registerBlockType } from '@wordpress-core/blocks';

/**
 * Internal dependencies
 */
import { select, resolveSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../assets/js/googlesitekit/modules/datastore/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../../assets/js/modules/reader-revenue-manager/datastore/constants';
import metadata from './block.json';
import Edit from './Edit';
import { CORE_EDIT_SITE } from '../common/constants';
// Since we aren't currently able to use `useSelect()` in the components,
// we need to resolve selectors before registering the block
// to ensure the data is available when the block is rendered.
Promise.all( [
	resolveSelect( CORE_MODULES ).getModule( 'reader-revenue-manager' ),
	resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings(),
] ).then( () => {
	const isSiteEditor = !! wp.data.select( CORE_EDIT_SITE );

	registerBlockType( metadata.name, {
		edit() {
			// Don't render the block in the site editor. Site editor support will be added in a future issue.
			if ( isSiteEditor ) {
				return null;
			}

			return <Edit select={ select } />;
		},
		supports: {
			// Don't allow the block to be inserted in the site editor.
			inserter: ! isSiteEditor,
		},
	} );
} );
