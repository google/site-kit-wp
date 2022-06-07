/**
 * UserRoleSelect component.
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
import { Chip, ChipCheckmark } from '@material/react-chips';
import isEqual from 'lodash/isEqual';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ESCAPE, ENTER } from '@wordpress/keycodes';
import { useState, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../Button';
import Link from '../Link';
import ShareIcon from '../../../svg/icons/share.svg';
import CloseIcon from '../../../svg/icons/close.svg';
import useViewContext from '../../hooks/useViewContext';
import { useKeyCodesInside } from '../../hooks/useKeyCodesInside';
import { trackEvent } from '../../util';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { EDITING_USER_ROLE_SELECT_SLUG_KEY } from './DashboardSharingSettings/constants';
const { useSelect, useDispatch } = Data;

const ALL_CHIP_ID = 'all';
const ALL_CHIP_DISPLAY_NAME = __( 'All', 'google-site-kit' );

export default function UserRoleSelect( { moduleSlug, isLocked = false } ) {
	const viewContext = useViewContext();
	const wrapperRef = useRef();

	const [ initialSharedRoles, setInitialSharedRoles ] = useState( [] );

	const { setSharedRoles } = useDispatch( CORE_MODULES );
	const { setValue } = useDispatch( CORE_UI );

	const shareableRoles = useSelect( ( select ) =>
		select( CORE_MODULES ).getShareableRoles()
	);
	const sharedRoles = useSelect( ( select ) =>
		select( CORE_MODULES ).getSharedRoles( moduleSlug )
	);
	const editingUserRoleSelect = useSelect( ( select ) =>
		select( CORE_UI ).getValue( EDITING_USER_ROLE_SELECT_SLUG_KEY )
	);
	const editMode = editingUserRoleSelect === moduleSlug;

	useKeyCodesInside( [ ESCAPE ], wrapperRef, () => {
		if ( editMode ) {
			setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, undefined );
		}
	} );

	const toggleEditMode = useCallback( () => {
		if ( ! editMode ) {
			if (
				! isEqual(
					[ ...( sharedRoles || [] ) ].sort(),
					initialSharedRoles
				)
			) {
				trackEvent(
					`${ viewContext }_sharing`,
					'change_shared_roles',
					moduleSlug
				);
			}

			// Set these state to disable modules in when editing user roles
			setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, moduleSlug );
		} else {
			setInitialSharedRoles( [ ...( sharedRoles || [] ) ].sort() );

			// Reset the state to enable modules in when not editing.
			setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, undefined );
		}
	}, [
		editMode,
		sharedRoles,
		initialSharedRoles,
		viewContext,
		moduleSlug,
		setValue,
	] );

	const toggleChip = useCallback(
		( { type, target, keyCode } ) => {
			if ( type === 'keyup' && keyCode !== ENTER ) {
				return;
			}

			const chip = target.closest( '.mdc-chip' );
			const chipID = chip?.dataset?.chipId; // eslint-disable-line sitekit/acronym-case

			if ( ! chipID ) {
				return;
			}

			let updatedSharedRoles;
			if ( chipID === ALL_CHIP_ID ) {
				if ( sharedRoles?.length === shareableRoles?.length ) {
					updatedSharedRoles = [];
				} else {
					updatedSharedRoles = shareableRoles.map( ( { id } ) => id );
				}
			} else if ( sharedRoles === null ) {
				updatedSharedRoles = [ chipID ];
			} else if ( sharedRoles.includes( chipID ) ) {
				updatedSharedRoles = sharedRoles.filter(
					( role ) => role !== chipID
				);
			} else {
				updatedSharedRoles = [ ...sharedRoles, chipID ];
			}

			setSharedRoles( moduleSlug, updatedSharedRoles );
		},
		[ moduleSlug, setSharedRoles, sharedRoles, shareableRoles ]
	);

	const getSharedRolesDisplayNames = () => {
		const roleDisplayNames = shareableRoles?.reduce( ( acc, role ) => {
			if ( sharedRoles.includes( role.id ) ) {
				acc.push( role.displayName );
			}
			return acc;
		}, [] );

		return roleDisplayNames.join( ', ' );
	};

	if ( ! shareableRoles ) {
		return null;
	}

	return (
		<div
			className={ classnames( 'googlesitekit-user-role-select', {
				'googlesitekit-user-role-select--open': editMode,
			} ) }
			ref={ wrapperRef }
		>
			<Button
				aria-label={
					editMode
						? __( 'Close', 'google-site-kit' )
						: __( 'Edit roles', 'google-site-kit' )
				}
				className="googlesitekit-user-role-select__button"
				onClick={ toggleEditMode }
				icon={
					editMode ? (
						<CloseIcon width={ 18 } height={ 18 } />
					) : (
						<ShareIcon width={ 23 } height={ 23 } />
					)
				}
				tabIndex={ isLocked ? -1 : undefined }
			/>

			{ ! editMode && sharedRoles?.length > 0 && (
				<span className="googlesitekit-user-role-select__current-roles">
					{ getSharedRolesDisplayNames() }
				</span>
			) }

			{ ! editMode && ( ! sharedRoles || sharedRoles?.length === 0 ) && (
				<span className="googlesitekit-user-role-select__add-roles">
					<Link
						onClick={ toggleEditMode }
						tabIndex={ isLocked ? -1 : undefined }
					>
						{ __( 'Add roles', 'google-site-kit' ) }
					</Link>
				</span>
			) }

			{ editMode && (
				<div className="googlesitekit-user-role-select__chipset">
					<Chip
						chipCheckmark={ <ChipCheckmark /> }
						data-chip-id={ ALL_CHIP_ID }
						id={ ALL_CHIP_ID }
						label={ ALL_CHIP_DISPLAY_NAME }
						onClick={ toggleChip }
						onKeyUp={ toggleChip }
						selected={
							sharedRoles?.length === shareableRoles?.length
						}
						className="googlesitekit-user-role-select__chip googlesitekit-user-role-select__chip--all"
					/>

					{ shareableRoles.map( ( { id, displayName }, index ) => (
						<Chip
							chipCheckmark={ <ChipCheckmark /> }
							data-chip-id={ id }
							id={ id }
							key={ index }
							label={ displayName }
							onClick={ toggleChip }
							onKeyUp={ toggleChip }
							selected={ sharedRoles?.includes( id ) }
							className="googlesitekit-user-role-select__chip"
						/>
					) ) }
				</div>
			) }
		</div>
	);
}

UserRoleSelect.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	isLocked: PropTypes.bool,
};
