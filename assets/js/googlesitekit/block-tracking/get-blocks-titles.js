/**
 * Utility function for getting blocks' titles from the inserter.
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
import { subscribe, select } from 'googlesitekit-data';

/**
 * Creates a function to retrieve block titles from the WordPress block editor inserter.
 *
 * Sets up a subscription to the block editor to retrieve block metadata from the inserter items.
 * Once all requested block titles are found, the subscription is automatically unsubscribed.
 * Returns a closure function that can be used to look up block titles by their ID.
 *
 * @since n.e.x.t
 *
 * @param {Array.<string>} blocks Array of block IDs to retrieve titles for.
 * @return {Function} A function that takes a block ID and returns its title.
 */
export const getBlocksTitles = ( blocks ) => {
	const blocksTitles = new Map();

	const unsubscribeInserterItems = subscribe( () => {
		select( 'core/block-editor' )
			.getInserterItems()
			.filter( ( { id } ) => blocks.includes( id ) )
			.forEach( ( { id, title } ) => blocksTitles.set( id, title ) );

		if ( blocksTitles.size === blocks.length ) {
			unsubscribeInserterItems();
		}
	} );

	return function ( blockID ) {
		return blocksTitles.get( blockID );
	};
};
