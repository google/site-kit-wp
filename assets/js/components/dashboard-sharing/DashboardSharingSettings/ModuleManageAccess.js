/**
 * ModuleManageAccess component for DashboardSharingSettings.
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
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PropTypes from 'prop-types';
import { Select, Tooltip } from 'googlesitekit-components';

const viewAccessOptions = [
	{
		value: 'owner',
		label: __( 'Only me', 'google-site-kit' ),
	},
	{
		value: 'all_admins',
		label: __( 'Any admin signed in with Google', 'google-site-kit' ),
	},
];

export default function ModuleManageAccess( {
	sharedOwnershipModule,
	hasOwnedModule,
	ownerUsername,
	hasSharingCapability,
	manageViewAccess,
	onChange,
} ) {
	if ( sharedOwnershipModule ) {
		return (
			<p className="googlesitekit-dashboard-sharing-settings__note">
				<span>
					{ __(
						'Any admin signed in with Google',
						'google-site-kit'
					) }
				</span>

				<Tooltip
					title={ __(
						'This service requires general access to Google APIs rather than access to a specific user-owned property/entity, so view access is manageable by any admin signed in with Google.',
						'google-site-kit'
					) }
				>
					<span className="googlesitekit-dashboard-sharing-settings__tooltip-icon">
						<Icon icon={ info } size={ 18 } />
					</span>
				</Tooltip>
			</p>
		);
	}

	if ( hasOwnedModule ) {
		return (
			<Select
				className="googlesitekit-dashboard-sharing-settings__select"
				value={ manageViewAccess }
				options={ viewAccessOptions }
				onChange={ onChange }
				onClick={ onChange }
				outlined
			/>
		);
	}

	if ( ownerUsername ) {
		return (
			<p className="googlesitekit-dashboard-sharing-settings__note">
				{ createInterpolateElement(
					sprintf(
						/* translators: %s: user who manages the module. */
						__(
							'<span>Managed by</span> <strong>%s</strong>',
							'google-site-kit'
						),
						ownerUsername
					),
					{
						span: <span />,
						strong: <strong />,
					}
				) }

				<Tooltip
					title={
						hasSharingCapability
							? sprintf(
									/* translators: %s: name of the user who manages the module. */
									__(
										'%s has connected this and given managing permissions to all admins. You can change who can view this on the dashboard.',
										'google-site-kit'
									),
									ownerUsername
							  )
							: sprintf(
									/* translators: %s: name of the user who manages the module. */
									__(
										'Contact %s to change who can manage view access for this module',
										'google-site-kit'
									),
									ownerUsername
							  )
					}
				>
					<span className="googlesitekit-dashboard-sharing-settings__tooltip-icon">
						<Icon icon={ info } size={ 18 } />
					</span>
				</Tooltip>
			</p>
		);
	}

	return null;
}

ModuleManageAccess.propTypes = {
	sharedOwnershipModule: PropTypes.bool,
	hasOwnedModule: PropTypes.bool,
	ownerUsername: PropTypes.string,
	hasSharingCapability: PropTypes.bool,
	manageViewAccess: PropTypes.string,
	onChange: PropTypes.func.isRequired,
};
