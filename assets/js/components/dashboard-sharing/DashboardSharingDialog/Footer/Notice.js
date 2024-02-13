/**
 * DashboardSharingSettings Notice component.
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
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

export default function Notice() {
	const canSubmitSharingChanges = useSelect( ( select ) =>
		select( CORE_MODULES ).canSubmitSharingChanges()
	);
	const haveSharingSettingsChangedManagement = useSelect( ( select ) =>
		select( CORE_MODULES ).haveSharingSettingsExpanded( 'management' )
	);
	const haveSharingSettingsChangedRoles = useSelect( ( select ) =>
		select( CORE_MODULES ).haveSharingSettingsExpanded( 'sharedRoles' )
	);

	return (
		<p className="googlesitekit-dashboard-sharing-settings__notice">
			{ haveSharingSettingsChangedManagement &&
				canSubmitSharingChanges &&
				createInterpolateElement(
					__(
						'By clicking <strong>Apply</strong>, you will give other authenticated admins of your site permission to manage view-only access to Site Kit Dashboard data from the chosen Google service',
						'google-site-kit'
					),
					{
						span: <span />,
						strong: <strong />,
					}
				) }
			{ ! haveSharingSettingsChangedManagement &&
				canSubmitSharingChanges &&
				haveSharingSettingsChangedRoles &&
				createInterpolateElement(
					__(
						'By clicking <strong>Apply</strong>, you’re granting the selected roles view-only access to data from the Google services you’ve connected via your account',
						'google-site-kit'
					),
					{
						span: <span />,
						strong: <strong />,
					}
				) }
		</p>
	);
}
