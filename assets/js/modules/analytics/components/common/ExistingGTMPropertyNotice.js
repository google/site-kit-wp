/**
 * Analytics Existing GTM Property Notice component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
const { useSelect } = Data;

export default function ExistingGTMPropertyNotice() {
	const {
		existingTag,
		gtmAnalyticsPropertyID,
		gtmAnalyticsPropertyIDPermission,
	} = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		const propertyID = select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID();

		return {
			existingTag: store.getExistingTag(),
			gtmAnalyticsPropertyID: propertyID,
			gtmAnalyticsPropertyIDPermission: store.hasTagPermission( propertyID ),
		};
	} );

	// Don't display this notice if:
	if (
		existingTag || // There is an existing tag.
		! gtmAnalyticsPropertyID || // There is no GTM tag.
		! gtmAnalyticsPropertyIDPermission // The current user doesn't have permissions for the GTM tag.
	) {
		return null;
	}

	const message = sprintf(
		/* translators: %s: Analytics tag ID */
		__( 'You’re already using Google Analytics through Google Tag Manager with the property %s. Site Kit will therefore not place an Analytics tag because Tag Manager already covers it.', 'google-site-kit' ),
		gtmAnalyticsPropertyID,
	);

	return <p>{ message }</p>;
}
