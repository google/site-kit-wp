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
import { useEffect } from '@wordpress-core/element';

/**
 * Internal dependencies
 */
import { dispatch, select, resolveSelect } from 'googlesitekit-data';
import { CORE_MODULES } from '../../../js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../../js/googlesitekit/datastore/user/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../../js/modules/reader-revenue-manager/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { CORE_EDIT_SITE } from '../common/constants';
import Edit from './Edit';
import metadata from './block.json';
import { trackEvent } from '../../../js/util/tracking';

export function withBlockTracking( BlockComponent ) {
	return function WrappedBlockComponent( props ) {
		useEffect( () => {
			const canTrackBlock = select(
				MODULES_READER_REVENUE_MANAGER
			).canTrackBlock( props.blockID );

			if ( canTrackBlock ) {
				trackEvent( 'insert_block', {
					blockID: props.blockID,
				} );

				dispatch( MODULES_READER_REVENUE_MANAGER ).setSeenBlockID(
					props.blockID
				);
			}
		}, [ props.blockID ] );
		return <BlockComponent { ...props } />;
	};
}

const EditWithTracking = withBlockTracking( Edit );

async function registerBlock() {
	// Since we aren't currently able to use the Site Kit `useSelect()` in the components,
	// we need to resolve selectors before registering the block
	// to ensure the data is available when the block is rendered.
	await Promise.all( [
		resolveSelect( CORE_MODULES ).getModule(
			MODULE_SLUG_READER_REVENUE_MANAGER
		),
		resolveSelect( CORE_USER ).getUser(),
		resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings(),
	] );

	const isSiteEditor = !! select( CORE_EDIT_SITE );

	registerBlockType( metadata.name, {
		// eslint-disable-next-line sitekit/acronym-case
		edit( { clientId } ) {
			// Don't render the block in the site editor. Site editor support will be added in a future issue.
			if ( isSiteEditor ) {
				return null;
			}

			// eslint-disable-next-line sitekit/acronym-case
			return <EditWithTracking blockID={ clientId } />;
		},
		supports: {
			// Don't allow the block to be inserted in the site editor.
			inserter: ! isSiteEditor,
		},
	} );
}

registerBlock();
