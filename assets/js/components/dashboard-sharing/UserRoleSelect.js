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
import { ChipSet, Chip } from '@material/react-chips';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';
import { useState, useCallback, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from '../Button';
import Link from '../Link';
import ShareIcon from '../../../svg/icons/share.svg';
import CloseIcon from '../../../svg/icons/close.svg';
import { useKeyCodesInside } from '../../hooks/useKeyCodesInside';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
const { useSelect, useDispatch } = Data;

export default function UserRoleSelect( { moduleSlug } ) {
	const wrapperRef = useRef();
	const { setSharedRoles } = useDispatch( CORE_MODULES );
	const [ editMode, setEditMode ] = useState( false );
	const shareableRoles = useSelect( ( select ) =>
		select( CORE_MODULES ).getShareableRoles()
	);
	const sharedRoles = useSelect( ( select ) =>
		select( CORE_MODULES ).getSharedRoles( moduleSlug )
	);

	// const shareableRoles = [
	// 	{
	// 		id: 1,
	// 		displayName: 'Administrator',
	// 	},
	// 	{
	// 		id: 2,
	// 		displayName: 'Authors',
	// 	},
	// 	{
	// 		id: 3,
	// 		displayName: 'Contributors',
	// 	},
	// 	{
	// 		id: 4,
	// 		displayName: 'Editors',
	// 	},
	// ];

	// const sharedRoles = [
	// 	{
	// 		id: 1,
	// 		displayName: 'Administrator',
	// 	},
	// 	{
	// 		id: 2,
	// 		displayName: 'Authors',
	// 	},
	// 	{
	// 		id: 3,
	// 		displayName: 'Contributors',
	// 	},
	// 	{
	// 		id: 4,
	// 		displayName: 'Editors',
	// 	},
	// ];

	useKeyCodesInside( [ ESCAPE ], wrapperRef, () => setEditMode( false ) );

	const toggleEditMode = useCallback( () => {
		setEditMode( ! editMode );
	}, [ editMode, setEditMode ] );

	const handleAllChip = useCallback( () => {}, [] );

	const handleSelect = useCallback(
		( chipIDs ) => {
			setSharedRoles( moduleSlug, chipIDs );
		},
		[ setSharedRoles, moduleSlug ]
	);

	if ( ! shareableRoles ) {
		return false;
	}

	const selectedChipIDs = sharedRoles.map( ( { id } ) => id );
	if ( sharedRoles.length === shareableRoles.length ) {
		selectedChipIDs.push( 'all' );
	}

	return (
		<div className="googlesitekit-user-role-select" ref={ wrapperRef }>
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
			/>

			{ ! editMode && sharedRoles.length > 0 && (
				<span className="googlesitekit-user-role-select__current-roles">
					{ sharedRoles
						.map( ( { displayName } ) => displayName )
						.join( ', ' ) }
				</span>
			) }

			{ ! editMode && sharedRoles.length === 0 && (
				<span className="googlesitekit-user-role-select__add-roles">
					<Link onClick={ toggleEditMode }>
						{ __( 'Add roles', 'google-site-kit' ) }
					</Link>
				</span>
			) }

			{ editMode && (
				<ChipSet
					selectedChipIds={ selectedChipIDs }
					className="googlesitekit-user-role-select__chipset"
					handleSelect={ handleSelect }
					filter
				>
					<Chip
						id="all"
						label={ __( 'All', 'google-site-kit' ) }
						className="googlesitekit-user-role-select__chip"
						handleSelect={ handleAllChip }
					/>

					{ shareableRoles.map( ( { id, displayName }, index ) => (
						<Chip
							id={ id }
							label={ displayName }
							key={ index }
							className="googlesitekit-user-role-select__chip"
						/>
					) ) }
				</ChipSet>
			) }
		</div>
	);
}

UserRoleSelect.propTypes = {
	moduleSlug: PropTypes.string.isRequired,
};
