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
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import {
	EDITING_MANAGEMENT_KEY,
	EDITING_USER_ROLE_SELECT_SLUG_KEY,
} from './constants';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
const { useSelect } = Data;

export default function Notice() {
	const editingUserRolesSlug = useSelect( ( select ) =>
		select( CORE_UI ).getValue( EDITING_USER_ROLE_SELECT_SLUG_KEY )
	);
	const isEditingManagement = useSelect( ( select ) =>
		select( CORE_UI ).getValue( EDITING_MANAGEMENT_KEY )
	);
	const canSubmitSharingChanges = useSelect( ( select ) =>
		select( CORE_MODULES ).canSubmitSharingChanges()
	);

	return (
		<p className="googlesitekit-dashboard-sharing-settings__notice">
			{ canSubmitSharingChanges &&
				isEditingManagement &&
				createInterpolateElement(
					__(
						'By clicking <strong>Apply</strong>, you are giving other admins permission to manage view-only access on your behalf to data from the Google services you selected “Any admin signed in with Google” for.',
						'google-site-kit'
					),
					{
						span: <span />,
						strong: <strong />,
					}
				) }
			{ ! isEditingManagement &&
				canSubmitSharingChanges &&
				editingUserRolesSlug &&
				createInterpolateElement(
					__(
						'By clicking <strong>Apply</strong>, you’re granting the selected roles view-only access to data from the Google services you’ve connected via your account.',
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
