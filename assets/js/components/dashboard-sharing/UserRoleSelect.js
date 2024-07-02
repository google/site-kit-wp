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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ESCAPE, ENTER } from '@wordpress/keycodes';
import {
	useCallback,
	useEffect,
	useRef,
	forwardRef,
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button, Chip } from 'googlesitekit-components';
import Link from '../Link';
import ShareIcon from '../../../svg/icons/share.svg';
import CheckIcon from '../../../svg/icons/check.svg';
import useViewContext from '../../hooks/useViewContext';
import { useKeyCodesInside } from '../../hooks/useKeyCodesInside';
import { trackEvent } from '../../util';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { EDITING_USER_ROLE_SELECT_SLUG_KEY } from './DashboardSharingSettings/constants';

const ALL_CHIP_ID = 'all';
const ALL_CHIP_DISPLAY_NAME = __( 'All', 'google-site-kit' );

const UserRoleSelect = forwardRef(
	( { moduleSlug, isLocked = false }, ref ) => {
		const viewContext = useViewContext();
		const roleSelectRef = useRef();

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

		useKeyCodesInside( [ ESCAPE ], ref, () => {
			if ( editMode ) {
				setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, undefined );
			}
		} );

		const haveSharingSettingsRolesChanged = useSelect( ( select ) =>
			select( CORE_MODULES ).haveModuleSharingSettingsChanged(
				moduleSlug,
				'sharedRoles'
			)
		);

		const toggleEditMode = useCallback( () => {
			if ( ! editMode ) {
				// Set the state to disable modules in when editing user roles
				setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, moduleSlug );
			} else {
				// Reset the state to enable modules in when not editing.
				setValue( EDITING_USER_ROLE_SELECT_SLUG_KEY, undefined );

				if ( haveSharingSettingsRolesChanged ) {
					trackEvent(
						`${ viewContext }_sharing`,
						'change_shared_roles',
						moduleSlug
					);
				}
			}
		}, [
			editMode,
			haveSharingSettingsRolesChanged,
			moduleSlug,
			setValue,
			viewContext,
		] );

		useEffect( () => {
			if ( ! roleSelectRef.current ) {
				return;
			}

			if ( editMode ) {
				// Focus on the "All" roles button.
				roleSelectRef.current.firstChild.focus();
			} else {
				// Focus on the role select button.
				roleSelectRef.current.focus();
			}
		}, [ editMode ] );

		const toggleChip = useCallback(
			( { type, target, keyCode } ) => {
				if ( type === 'keydown' && keyCode !== ENTER ) {
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
						updatedSharedRoles = shareableRoles.map(
							( { id } ) => id
						);
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
			>
				{ ! editMode && (
					<Button
						aria-label={ __( 'Edit roles', 'google-site-kit' ) }
						className="googlesitekit-user-role-select__button"
						onClick={ toggleEditMode }
						icon={ <ShareIcon width={ 23 } height={ 23 } /> }
						tabIndex={ isLocked ? -1 : undefined }
						ref={ roleSelectRef }
					/>
				) }

				{ ! editMode && sharedRoles?.length > 0 && (
					<span className="googlesitekit-user-role-select__current-roles">
						{ getSharedRolesDisplayNames() }
					</span>
				) }

				{ ! editMode &&
					( ! sharedRoles || sharedRoles?.length === 0 ) && (
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
					<Fragment>
						<div
							className="googlesitekit-user-role-select__chipset"
							ref={ roleSelectRef }
						>
							<Chip
								id={ ALL_CHIP_ID }
								label={ ALL_CHIP_DISPLAY_NAME }
								onClick={ toggleChip }
								onKeyDown={ toggleChip }
								selected={
									sharedRoles?.length ===
									shareableRoles?.length
								}
								className="googlesitekit-user-role-select__chip--all"
							/>

							{ shareableRoles.map(
								( { id, displayName }, index ) => (
									<Chip
										key={ index }
										id={ id }
										label={ displayName }
										onClick={ toggleChip }
										onKeyDown={ toggleChip }
										selected={ sharedRoles?.includes( id ) }
									/>
								)
							) }
						</div>
						<Button
							aria-label={ __(
								'Done editing roles',
								'google-site-kit'
							) }
							title={ __( 'Done', 'google-site-kit' ) }
							className="googlesitekit-user-role-select__button"
							onClick={ toggleEditMode }
							icon={ <CheckIcon width={ 18 } height={ 18 } /> }
							tabIndex={ isLocked ? -1 : undefined }
						/>
					</Fragment>
				) }
			</div>
		);
	}
);

UserRoleSelect.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
	isLocked: PropTypes.bool,
};

export default UserRoleSelect;
