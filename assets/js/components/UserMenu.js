/**
 * UserMenu component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { useClickAway } from 'react-use';

/**
 * WordPress dependencies
 */
import { Fragment, useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { clearWebStorage } from '../util';
import Dialog from './Dialog';
import Button from './Button';
import Menu from './Menu';
import Portal from './Portal';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../googlesitekit/datastore/user/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import { useKeyCodesInside } from '../hooks/useKeyCodesInside';
const { useSelect, useDispatch } = Data;

function UserMenu() {
	const proxyPermissionsURL = useSelect( ( select ) => select( CORE_SITE ).getProxyPermissionsURL() );
	const userEmail = useSelect( ( select ) => select( CORE_USER ).getEmail() );
	const userPicture = useSelect( ( select ) => select( CORE_USER ).getPicture() );
	const postDisconnectURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-splash', { googlesitekit_context: 'revoked' } ) );

	const [ dialogActive, toggleDialog ] = useState( false );
	const [ menuOpen, setMenuOpen ] = useState( false );
	const menuWrapperRef = useRef();
	const { navigateTo } = useDispatch( CORE_LOCATION );

	useClickAway( menuWrapperRef, () => setMenuOpen( false ) );
	useKeyCodesInside( [ ESCAPE, TAB ], menuWrapperRef, () => setMenuOpen( false ) );

	useEffect( () => {
		const handleDialogClose = ( e ) => {
			// Close if Escape key is pressed.
			if ( ESCAPE === e.keyCode ) {
				toggleDialog( false );
				setMenuOpen( false );
			}
		};

		global.addEventListener( 'keyup', handleDialogClose );

		return () => {
			global.removeEventListener( 'keyup', handleDialogClose );
		};
	}, [] );

	const handleMenu = useCallback( () => {
		setMenuOpen( ! menuOpen );
	}, [ menuOpen ] );

	const handleDialog = useCallback( () => {
		toggleDialog( ! dialogActive );
		setMenuOpen( false );
	}, [ dialogActive ] );

	const handleMenuItemSelect = useCallback( ( index ) => {
		switch ( index ) {
			case 0:
				handleDialog();
				break;
			case 1:
				if ( proxyPermissionsURL ) {
					navigateTo( proxyPermissionsURL );
				}
				break;
			default:
				handleMenu();
		}
	}, [ proxyPermissionsURL, handleMenu, handleDialog, navigateTo ] );

	// Log the user out if they confirm the dialog.
	const handleUnlinkConfirm = useCallback( () => {
		// Close the modal.
		toggleDialog( false );

		// Clear caches.
		clearWebStorage();

		// Navigate back to the splash screen to reconnect.
		navigateTo( postDisconnectURL );
	}, [ postDisconnectURL, navigateTo ] );

	if ( ! userEmail ) {
		return null;
	}

	return (
		<Fragment>
			<div ref={ menuWrapperRef } className="googlesitekit-user-selector googlesitekit-dropdown-menu googlesitekit-dropdown-menu__icon-menu mdc-menu-surface--anchor">
				<Button
					className="googlesitekit-header__dropdown mdc-button--dropdown"
					text
					onClick={ handleMenu }
					icon={
						!! userPicture && (
							<i className="mdc-button__icon" aria-hidden="true">
								<img
									className="mdc-button__icon--image"
									src={ userPicture }
									alt={ __( 'User Avatar', 'google-site-kit' ) }
								/>
							</i>
						)
					}
					aria-haspopup="menu"
					aria-expanded={ menuOpen }
					aria-controls="user-menu"
				>
					{ userEmail }
				</Button>
				<Menu
					className="googlesitekit-width-auto"
					menuOpen={ menuOpen }
					menuItems={
						[
							__( 'Disconnect', 'google-site-kit' ),
						].concat(
							proxyPermissionsURL ? [
								__( 'Manage sites…', 'google-site-kit' ),
							] : [],
						)
					}
					onSelected={ handleMenuItemSelect }
					id="user-menu" />
			</div>
			<Portal>
				<Dialog
					dialogActive={ dialogActive }
					handleConfirm={ handleUnlinkConfirm }
					handleDialog={ handleDialog }
					title={ __( 'Disconnect', 'google-site-kit' ) }
					subtitle={ __( 'Disconnecting Site Kit by Google will remove your access to all services. After disconnecting, you will need to re-authorize to restore service.', 'google-site-kit' ) }
					confirmButton={ __( 'Disconnect', 'google-site-kit' ) }
					danger
				/>
			</Portal>
		</Fragment>

	);
}

export default UserMenu;
