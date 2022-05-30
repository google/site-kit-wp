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
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Tooltip } from '@material-ui/core';

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
import UserRoleSelect from '../UserRoleSelect';
import { Select } from '../../../material-components';
import useViewContext from '../../../hooks/useViewContext';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import {
	EDITING_MANAGEMENT_KEY,
	EDITING_USER_ROLES_KEY,
	SHARING_SETTINGS_SLUG_KEY,
} from './constants';
import { trackEvent } from '../../../util';
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
	const viewContext = useViewContext();

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
		select( CORE_MODULES ).isDoingSubmitSharingChanges()
	);

	const { setSharingManagement } = useDispatch( CORE_MODULES );
	const { setValue } = useDispatch( CORE_UI );

	useEffect( () => {
		if ( sharedOwnershipModule ) {
			setManageViewAccess( 'all_admins' );
		} else {
			setManageViewAccess( management );
		}
	}, [ management, sharedOwnershipModule ] );

	const handleOnChange = useCallback(
		( event ) => {
			const value = event.target.value;
			setValue( EDITING_MANAGEMENT_KEY, true );
			setValue( SHARING_SETTINGS_SLUG_KEY, moduleSlug );
			setManageViewAccess( value );
			setSharingManagement( moduleSlug, value );
			trackEvent(
				`${ viewContext }_sharing`,
				`change_management_${ value }`,
				moduleSlug
			);
		},
		[
			moduleSlug,
			viewContext,
			setManageViewAccess,
			setSharingManagement,
			setValue,
		]
	);

	const isLocked =
		( moduleSlug !== editingModuleSlug && isEditingUserRoles ) || isSaving;
	const isEditing = moduleSlug === editingModuleSlug && isEditingUserRoles;

	return (
		<div
			className={ classnames(
				'googlesitekit-dashboard-sharing-settings__module',
				'googlesitekit-dashboard-sharing-settings__row',
				{
					'googlesitekit-dashboard-sharing-settings__row--editing': isEditing,
					'googlesitekit-dashboard-sharing-settings__row--disabled': isLocked,
				}
			) }
			key={ moduleSlug }
		>
			<div className="googlesitekit-dashboard-sharing-settings__column--product">
				<ModuleIcon slug={ moduleSlug } size={ 48 } />

				<span className="googlesitekit-dashboard-sharing-settings__module-name">
					{ moduleName }
				</span>
			</div>

			<div className="googlesitekit-dashboard-sharing-settings__column--view">
				{ hasOwnedModule && (
					<UserRoleSelect
						moduleSlug={ moduleSlug }
						isLocked={ isLocked }
					/>
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
