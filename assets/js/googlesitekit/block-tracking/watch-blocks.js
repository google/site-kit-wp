/**
 * Watch and track blocks once they are inserted in the block editor.
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
 * Internal dependencies
 */
import { trackEvent } from '@/js/util';
import { subscribe, select } from 'googlesitekit-data';
import { VIEW_CONTEXT_WP_BLOCK_EDITOR } from '../constants';
import { createGetBlockTitle } from './create-get-blocks-titles';

/**
 * Watches for specific blocks being inserted in the WordPress block editor and tracks them.
 *
 * Sets up a subscription to monitor when blocks are added to the editor. When a tracked
 * block is newly inserted and selected, it sends a Google Analytics event to track the insertion.
 *
 * @since 1.160.0
 *
 * @param {Array.<string>} blocksToTrack Array of block names to track (e.g., 'google-site-kit/rrm-subscribe-with-google').
 */
export function watchBlocks( blocksToTrack ) {
	const getBlockTitle = createGetBlockTitle( blocksToTrack );

	const addedBlocks = new Set(
		select( 'core/block-editor' )
			.getBlocks()
			// eslint-disable-next-line sitekit/acronym-case
			.map( ( block ) => block.clientId )
	);

	subscribe( () => {
		const blocks = select( 'core/block-editor' ).getBlocks();

		blocks.forEach( ( block ) => {
			// eslint-disable-next-line sitekit/acronym-case
			const { clientId: blockID, name } = block;
			if (
				blocksToTrack.includes( name ) &&
				! addedBlocks.has( blockID ) &&
				select( 'core/block-editor' ).isBlockSelected( blockID )
			) {
				trackEvent(
					`${ VIEW_CONTEXT_WP_BLOCK_EDITOR }_rrm`,
					'insert_block',
					getBlockTitle( name )
				);
			}
			addedBlocks.add( blockID );
		} );
	} );
}
