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

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import ModuleIcon from '../../ModuleIcon';
import useViewContext from '../../../hooks/useViewContext';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../googlesitekit/datastore/ui/constants';
import { EDITING_USER_ROLE_SELECT_SLUG_KEY } from './constants';
import { trackEvent } from '../../../util';
import {
	CORE_USER,
	PERMISSION_DELEGATE_MODULE_SHARING_MANAGEMENT,
	PERMISSION_MANAGE_MODULE_SHARING_OPTIONS,
} from '../../../googlesitekit/datastore/user/constants';
import ModuleViewAccess from './ModuleViewAccess';
import ModuleManageAccess from './ModuleManageAccess';

export default function Module( {
	moduleSlug,
	moduleName,
	ownerUsername,
	recoverable,
} ) {
	const viewContext = useViewContext();
	const moduleRef = useRef();

	const [ manageViewAccess, setManageViewAccess ] = useState( undefined );

	const hasRecoverableModules = useSelect( ( select ) =>
		select( CORE_MODULES ).hasRecoverableModules()
	);
	const hasMultipleAdmins = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);
	const showManageColumn = hasRecoverableModules || hasMultipleAdmins;

	const management = useSelect(
		( select ) =>
			select( CORE_MODULES ).getSharingManagement( moduleSlug ) ?? 'owner'
	);
	const hasOwnedModule = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability(
			PERMISSION_DELEGATE_MODULE_SHARING_MANAGEMENT,
			moduleSlug
		)
	);
	const hasSharingCapability = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability(
			PERMISSION_MANAGE_MODULE_SHARING_OPTIONS,
			moduleSlug
		)
	);
	const sharedOwnershipModules = useSelect( ( select ) =>
		select( CORE_MODULES ).getSharedOwnershipModules()
	);
	const editingUserRolesSlug = useSelect( ( select ) =>
		select( CORE_UI ).getValue( EDITING_USER_ROLE_SELECT_SLUG_KEY )
	);
	const isSaving = useSelect( ( select ) =>
		select( CORE_MODULES ).isDoingSubmitSharingChanges()
	);

	const recoverableModuleSupportLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL(
			'dashboard-sharing-module-recovery'
		)
	);

	const { setSharingManagement } = useDispatch( CORE_MODULES );

	const sharedOwnershipModule =
		sharedOwnershipModules &&
		Object.keys( sharedOwnershipModules ).includes( moduleSlug );

	useEffect( () => {
		if ( sharedOwnershipModule ) {
			setManageViewAccess( 'all_admins' );
		} else {
			setManageViewAccess( management );
		}
	}, [ management, sharedOwnershipModule ] );

	const haveSharingSettingsManagementChanged = useSelect( ( select ) =>
		select( CORE_MODULES ).haveModuleSharingSettingsChanged(
			moduleSlug,
			'management'
		)
	);

	useEffect( () => {
		if ( haveSharingSettingsManagementChanged ) {
			trackEvent(
				`${ viewContext }_sharing`,
				`change_management_${ management }`,
				moduleSlug
			);
		}
	}, [
		haveSharingSettingsManagementChanged,
		management,
		moduleSlug,
		viewContext,
	] );

	const handleOnChange = useCallback(
		( event ) => {
			const value = event.target.value;
			setManageViewAccess( value );
			setSharingManagement( moduleSlug, value );
		},
		[ setSharingManagement, setManageViewAccess, moduleSlug ]
	);

	const isEditingUserRoles = moduleSlug === editingUserRolesSlug;
	const isLocked =
		( ! isEditingUserRoles && editingUserRolesSlug !== undefined ) ||
		isSaving;

	return (
		<div
			className={ classnames(
				'googlesitekit-dashboard-sharing-settings__module',
				'googlesitekit-dashboard-sharing-settings__row',
				{
					'googlesitekit-dashboard-sharing-settings__row--editing':
						isEditingUserRoles,
					'googlesitekit-dashboard-sharing-settings__row--disabled':
						isLocked,
				}
			) }
			ref={ moduleRef }
		>
			<div className="googlesitekit-dashboard-sharing-settings__column--product">
				<ModuleIcon slug={ moduleSlug } size={ 48 } />

				<span className="googlesitekit-dashboard-sharing-settings__module-name">
					{ moduleName }
				</span>
			</div>

			<div className="googlesitekit-dashboard-sharing-settings__column--view">
				<ModuleViewAccess
					moduleSlug={ moduleSlug }
					isLocked={ isLocked }
					hasSharingCapability={ hasSharingCapability }
					recoverable={ recoverable }
					recoverableModuleSupportLink={
						recoverableModuleSupportLink
					}
					ref={ moduleRef }
				/>
			</div>

			{ showManageColumn && (
				<div className="googlesitekit-dashboard-sharing-settings__column--manage">
					<ModuleManageAccess
						sharedOwnershipModule={ sharedOwnershipModule }
						hasOwnedModule={ hasOwnedModule }
						ownerUsername={ ownerUsername }
						hasSharingCapability={ hasSharingCapability }
						manageViewAccess={ manageViewAccess }
						onChange={ handleOnChange }
					/>
				</div>
			) }
		</div>
	);
}

Module.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	moduleName: PropTypes.string.isRequired,
	ownerUsername: PropTypes.string,
	recoverable: PropTypes.bool,
};
