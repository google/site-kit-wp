/**
 * Reader Revenue Manager plugin tracking.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { select, subscribe } from 'googlesitekit-data';
import { trackEvent } from '@/js/util';
import { CORE_EDITOR } from '../common/constants';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { VIEW_CONTEXT_WP_BLOCK_EDITOR } from '@/js/googlesitekit/constants';

/**
 * Tracks changes to the Reader Revenue Manager metadata in the post editor.
 *
 * @since 1.156.0
 *
 * @return {void}
 */
export function initializeTracking() {
	let wasSaving = false;
	let previousMetadata = null;

	subscribe( () => {
		const publicationID = select(
			MODULES_READER_REVENUE_MANAGER
		).getPublicationID();

		if ( publicationID === undefined ) {
			return;
		}

		// Retrieve the initial metadata when the publication ID is defined, which
		// will occur before the post is saved.
		if ( previousMetadata === null ) {
			previousMetadata = getTrackedMetadata();
			return;
		}

		// Check if the post is being saved.
		const isSaving = select( CORE_EDITOR ).isSavingPost();
		const isAutosaving = select( CORE_EDITOR ).isAutosavingPost();

		// Detect when saving completes.
		if ( wasSaving && ! isSaving && ! isAutosaving ) {
			const currentMetadata = getTrackedMetadata();

			if ( hasMetadataChanged( previousMetadata, currentMetadata ) ) {
				const metaKey = getMetaKey();

				trackEvent(
					`${ VIEW_CONTEXT_WP_BLOCK_EDITOR }_rrm`,
					'change_product_id',
					getProductIDTrackingLabel( currentMetadata[ metaKey ] )
				);

				// Update previous metadata for the next comparison.
				previousMetadata = { ...currentMetadata };
			}
		}

		wasSaving = isSaving;
	} );
}

function getMetaKey() {
	const publicationID = select(
		MODULES_READER_REVENUE_MANAGER
	).getPublicationID();

	const metaKey = `googlesitekit_rrm_${ publicationID }:productID`;

	return metaKey;
}

function getTrackedMetadata() {
	const post = select( CORE_EDITOR ).getCurrentPost();

	if ( ! post ) {
		return {};
	}

	const metaKey = getMetaKey();

	return {
		[ metaKey ]: post.meta?.[ metaKey ] || '',
	};
}

function hasMetadataChanged( previous, current ) {
	const previousKeys = Object.keys( previous );
	const currentKeys = Object.keys( current );

	// Check if the number of keys has changed.
	if ( previousKeys.length !== currentKeys.length ) {
		return true;
	}

	// Check if any values have changed.
	return previousKeys.some( ( key ) => previous[ key ] !== current[ key ] );
}

function getProductIDTrackingLabel( productID ) {
	switch ( productID ) {
		case '':
			return __( 'Default', 'google-site-kit' );
		case 'none':
			return __( 'None', 'google-site-kit' );
		case 'openaccess':
			return __( 'Open access', 'google-site-kit' );
		default:
			return __( 'Custom product ID', 'google-site-kit' );
	}
}
