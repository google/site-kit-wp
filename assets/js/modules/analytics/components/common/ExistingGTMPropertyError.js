/**
 * Analytics Existing GTM Property Error component.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import ErrorText from '../../../../components/ErrorText';
const { useSelect } = Data;

export default function ExistingGTMPropertyError() {
	const gtmAnalyticsPropertyID = useSelect( ( select ) => select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID() );
	const gtmAnalyticsPropertyIDPermission = useSelect( ( select ) => select( STORE_NAME ).hasTagPermission( gtmAnalyticsPropertyID ) );

	// Don't display error notice if:
	if (
		! gtmAnalyticsPropertyID || // There is no GTM tag.
		gtmAnalyticsPropertyIDPermission || // There is a GTM tag and user has access to it.
		gtmAnalyticsPropertyIDPermission === undefined // We don't know yet whether the current user has permissions to the GTM tag.
	) {
		return null;
	}

	const message = sprintf(
		/* translators: %s: Property id of the existing tag */
		__( 'You’re already using Google Analytics through Google Tag Manager with the property %s, but your account doesn’t seem to have access to this Analytics property. You can either modify your Tag Manager configuration to use a different property, or request access to this property from your team.', 'google-site-kit' ),
		gtmAnalyticsPropertyID,
	);

	return <ErrorText message={ message } />;
}
