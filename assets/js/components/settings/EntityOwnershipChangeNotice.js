/**
 * EntityOwnershipChangeNotice component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { useFeature } from '../../hooks/useFeature';
import SettingsNotice from '../SettingsNotice/SettingsNotice';
import { TYPE_WARNING } from '../SettingsNotice/utils';
const { useSelect } = Data;

export default function EntityOwnershipChangeNotice( { slug } ) {
	const isDashboardSharingEnabled = useFeature( 'dashboardSharing' );

	const storeName = useSelect( ( select ) =>
		select( CORE_MODULES ).getModuleStoreName( slug )
	);

	const haveOwnedSettingsChanged = useSelect( ( select ) =>
		select( storeName )?.haveOwnedSettingsChanged()
	);

	const moduleOwnerID = useSelect( ( select ) =>
		select( storeName )?.getOwnerID()
	);

	const loggedInUserID = useSelect( ( select ) =>
		select( CORE_USER ).getID()
	);

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( slug )
	);

	const isModuleOwnedByUser = moduleOwnerID === loggedInUserID;

	if (
		! isDashboardSharingEnabled ||
		! haveOwnedSettingsChanged ||
		isModuleOwnedByUser
	) {
		return null;
	}

	return (
		<SettingsNotice
			type={ TYPE_WARNING }
			notice={ sprintf(
				/* translators: %s: module name. */
				__(
					'By clicking confirm changes, you’re granting other users view-only access to data from %s via your Google account. You can always manage this later in the dashboard sharing settings.',
					'google-site-kit'
				),
				module?.name
			) }
		/>
	);
}
