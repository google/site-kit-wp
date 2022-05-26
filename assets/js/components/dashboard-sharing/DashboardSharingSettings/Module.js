/**
 * DashboardSharingSettings Module component.
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
 * External dependencies
 */
import { Tooltip } from '@material-ui/core';

/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Icon, info } from '@wordpress/icons';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ModuleIcon from '../../ModuleIcon';
import { Select } from '../../../material-components';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import UserRoleSelect from '../UserRoleSelect';
import SettingsOverlay from '../../settings/SettingsOverlay';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import {
	EDITING_USER_ROLES_KEY,
	SHARING_SETINGS_SAVING_KEY,
	SHARING_SETTINGS_SLUG_KEY,
} from './constants';
const { useSelect, useDispatch } = Data;

const viewAccessOptions = [
	{
		value: 'owner',
		label: __( 'Only Me', 'google-site-kit' ),
	},
	{
		value: 'all_admins',
		label: __( 'All Admins', 'google-site-kit' ),
	},
];

export default function Module( {
	moduleSlug,
	moduleName,
	management,
	ownerUsername,
	sharedOwnershipModule,
	hasOwnedModule,
} ) {
	const [ manageViewAccess, setManageViewAccess ] = useState( undefined );
	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( moduleSlug )
	);
	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);

	const isEditingUserRoles = useSelect( ( select ) =>
		select( CORE_UI ).getValue( EDITING_USER_ROLES_KEY )
	);
	const editingModuleSlug = useSelect( ( select ) =>
		select( CORE_UI ).getValue( SHARING_SETTINGS_SLUG_KEY )
	);
	const isSaving = useSelect( ( select ) =>
		select( CORE_UI ).getValue( SHARING_SETINGS_SAVING_KEY )
	);

	const { setSharingManagement } = useDispatch( CORE_MODULES );

	useEffect( () => {
		setManageViewAccess( management );
	}, [ management ] );

	const handleOnChange = useCallback(
		( event ) => {
			setManageViewAccess( event.target.value );
			setSharingManagement( moduleSlug, event.target.value );
		},
		[ moduleSlug, setManageViewAccess, setSharingManagement ]
	);

	const isLocked =
		( moduleSlug !== editingModuleSlug && isEditingUserRoles ) || isSaving;

	return (
		<div
			className="googlesitekit-dashboard-sharing-settings__module googlesitekit-dashboard-sharing-settings__row"
			key={ moduleSlug }
		>
			{ /* Disable other modules when editing sharing settings for a module. */ }
			{ isLocked && <SettingsOverlay compress /> }

			<div className="googlesitekit-dashboard-sharing-settings__column--product">
				<ModuleIcon slug={ moduleSlug } size={ 48 } />

				<span className="googlesitekit-dashboard-sharing-settings__module-name">
					{ moduleName }
				</span>
			</div>

			<div className="googlesitekit-dashboard-sharing-settings__column--view">
				{ hasOwnedModule && (
					<UserRoleSelect moduleSlug={ moduleSlug } />
				) }

				{ ! hasOwnedModule && (
					<p className="googlesitekit-dashboard-sharing-settings__note">
						{ __(
							'Contact managing user to manage view access',
							'google-site-kit'
						) }
					</p>
				) }
			</div>

			{ hasMultipleAdmins && (
				<div className="googlesitekit-dashboard-sharing-settings__column--manage">
					{ hasOwnedModule && (
						<Select
							className="googlesitekit-dashboard-sharing-settings__select"
							value={ manageViewAccess }
							options={ viewAccessOptions }
							onChange={ handleOnChange }
							onClick={ handleOnChange }
							disabled={ sharedOwnershipModule }
							outlined
						/>
					) }

					{ ! hasOwnedModule && module?.owner?.login && (
						<p className="googlesitekit-dashboard-sharing-settings__note">
							{ createInterpolateElement(
								sprintf(
									/* translators: %s: user who manages the module. */
									__(
										'<span>Managed by </span> <strong>%s</strong>',
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
								title={ sprintf(
									/* translators: %s: name of the user who manages the module. */
									__(
										'%s has connected this and given managing permissions to all admins. You can change who can view this on the dashboard.',
										'google-site-kit'
									),
									ownerUsername
								) }
								classes={ {
									popper: 'googlesitekit-tooltip-popper',
									tooltip: 'googlesitekit-tooltip',
								} }
							>
								<span className="googlesitekit-dashboard-sharing-settings__tooltip-icon">
									<Icon icon={ info } size={ 18 } />
								</span>
							</Tooltip>
						</p>
					) }
				</div>
			) }
		</div>
	);
}

Module.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	moduleName: PropTypes.string.isRequired,
	management: PropTypes.string,
	ownerUsername: PropTypes.string,
	sharedOwnershipModule: PropTypes.bool.isRequired,
	hasOwnedModule: PropTypes.bool.isRequired,
};
