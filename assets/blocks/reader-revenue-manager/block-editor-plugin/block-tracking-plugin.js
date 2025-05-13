/* eslint-disable sitekit/acronym-case */
/**
 * Reader Revenue Manager pluign registration.
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
import { registerPlugin } from '@wordpress-core/plugins';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';

const { select, subscribe } = Data;

const BLOCKS_TO_TRACK = [
	'google-site-kit/rrm-subscribe-with-google',
	'google-site-kit/rrm-contribute-with-google',
];

let previousBlocks = [];

const trackEvent = ( eventName, details ) => {
	// eslint-disable-next-line no-console
	console.log( `Tracking: ${ eventName }`, details );
};

const trackBlockChanges = () => {
	const currentBlocks = select( 'core/block-editor' ).getBlocks();

	// Check for inserted blocks
	currentBlocks.forEach( ( block ) => {
		if (
			BLOCKS_TO_TRACK.includes( block.name ) &&
			! previousBlocks.some(
				( prevBlock ) => prevBlock.clientId === block.clientId
			)
		) {
			trackEvent( 'block_inserted', block.name );
		}
	} );

	// Check for removed blocks
	previousBlocks.forEach( ( prevBlock ) => {
		if (
			BLOCKS_TO_TRACK.includes( prevBlock.name ) &&
			! currentBlocks.some(
				( block ) => block.clientId === prevBlock.clientId
			)
		) {
			trackEvent( 'block_removed', prevBlock.name );
		}
	} );

	previousBlocks = [ ...currentBlocks ];
};

const GoogleBlocksTracker = () => {
	// Set up subscription to block changes
	const unsubscribe = subscribe( () => {
		trackBlockChanges();
	} );

	// Clean up on unmount
	return () => unsubscribe();
};

export function registerBlockTrackingPlugin() {
	registerPlugin( 'google-blocks-tracker', {
		render: GoogleBlocksTracker,
		icon: 'google', // You can choose an appropriate icon
	} );
}
