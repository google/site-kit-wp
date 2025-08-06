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

import { subscribe, select } from 'googlesitekit-data';

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
