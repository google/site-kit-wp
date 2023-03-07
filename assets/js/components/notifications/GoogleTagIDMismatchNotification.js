/**
 * GoogleTagIDMismatchNotification component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import { listFormat } from '../../util';
import BannerNotification from './BannerNotification';

const { useSelect } = Data;

export default function GoogleTagIDMismatchNotification() {
	const hasMismatchedGoogleTagID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasMismatchedGoogleTagID()
	);

	const googleTagAccountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getGoogleTagAccountID()
	);

	const googleTagContainerID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getGoogleTagContainerID()
	);

	const googleTagContainerDestinations = useSelect(
		( select ) =>
			hasMismatchedGoogleTagID &&
			select( MODULES_ANALYTICS_4 ).getGoogleTagContainerDestinations(
				googleTagAccountID,
				googleTagContainerID
			)
	);

	if (
		! hasMismatchedGoogleTagID ||
		! Array.isArray( googleTagContainerDestinations )
	) {
		return null;
	}

	const destinationIDs = googleTagContainerDestinations.map(
		// eslint-disable-next-line sitekit/acronym-case
		( destination ) => destination.destinationId
	);

	return (
		<BannerNotification
			id="google-tag-id-mismatch"
			title={ __( 'Google Tag ID mismatch', 'google-site-kit' ) }
			description={ sprintf(
				/* translators: %s: List of destination IDs. */
				__(
					'The following mismatched Google Tag IDs were found: %s',
					'google-site-kit'
				),
				listFormat( destinationIDs )
			) }
			dismiss={ __( 'Cancel', 'google-site-kit' ) }
		/>
	);
}
