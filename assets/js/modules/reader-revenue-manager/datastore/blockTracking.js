/**
 * `modules/reader-revenue-manager` data store: blockTracking.
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
import { CORE_BLOCK_EDITOR } from '@/blocks/reader-revenue-manager/common/constants';
import { MODULES_READER_REVENUE_MANAGER } from './constants';
import { dispatch, select, subscribe } from 'googlesitekit-data';

const initialState = { isEditorReady: false, seenBlockIDs: [] };

const actions = {
	/**
	 * Sets the list of block IDs that have already been seen.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array.<string>} blockIDs Array of block client IDs.
	 * @return {Object} Redux-style action.
	 */
	setSeenBlockIDs: ( blockIDs ) => {
		return {
			type: 'SET_SEEN_BLOCK_IDS',
			payload: blockIDs,
		};
	},

	/**
	 * Adds a single block ID to the list of seen blocks.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} blockID Block client ID.
	 * @return {Object} Redux-style action.
	 */
	setSeenBlockID: ( blockID ) => {
		return {
			type: 'SET_SEEN_BLOCK_ID',
			payload: blockID,
		};
	},
};

const reducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case 'SET_SEEN_BLOCK_IDS':
			return {
				...state,
				isEditorReady: true,
				seenBlockIDs: payload,
			};
		case 'SET_SEEN_BLOCK_ID':
			return {
				...state,
				seenBlockIDs: [ ...state.seenBlockIDs, payload ],
			};
		default:
			return state;
	}
};

const selectors = {
	/**
	 * Checks if the editor is ready for block tracking.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} True if the editor is ready, false otherwise.
	 */
	isEditorReady: ( state ) => state.isEditorReady,

	/**
	 * Determines if a block can be tracked.
	 *
	 * A block can be tracked if the editor is ready and the block
	 * has not been seen before.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} state   Data store's state.
	 * @param {string} blockID Block client ID to check.
	 * @return {boolean} True if the block can be tracked, false otherwise.
	 */
	canTrackBlock: ( state, blockID ) =>
		state.isEditorReady && ! state.seenBlockIDs.includes( blockID ),
};

const store = {
	initialState,
	actions,
	reducer,
	selectors,
};

const unsubscribe = subscribe( () => {
	const blockEditorStore = select( CORE_BLOCK_EDITOR );

	if ( ! blockEditorStore ) {
		return;
	}

	const blocks = blockEditorStore.getBlocks();

	if (
		blocks.length &&
		! select( MODULES_READER_REVENUE_MANAGER ).isEditorReady()
	) {
		dispatch( MODULES_READER_REVENUE_MANAGER ).setSeenBlockIDs(
			// eslint-disable-next-line sitekit/acronym-case
			blocks.map( ( block ) => block.clientId )
		);

		unsubscribe();
	}
} );

export default store;
