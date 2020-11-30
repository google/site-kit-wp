/**
 * UserMenu component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
import { Fragment, useState, useRef, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { clearWebStorage } from '../util';
import Dialog from './Dialog';
import Button from './Button';
import Menu from './Menu';
import Modal from './Modal';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_USER } from '../googlesitekit/datastore/user/constants';

const { useSelect } = Data;

function UserMenu() {
	const proxyPermissionsURL = useSelect( ( select ) => select( CORE_SITE ).getProxyPermissionsURL() );
	const userEmail = useSelect( ( select ) => select( CORE_USER ).getEmail() );
	const userPicture = useSelect( ( select ) => select( CORE_USER ).getPicture() );
	const postDisconnectURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-splash', { googlesitekit_context: 'revoked' } ) );

	const [ dialogActive, toggleDialog ] = useState( false );
	const [ menuOpen, toggleMenu ] = useState( false );
	const menuButtonRef = useRef();
	const menuRef = useRef();

	useEffect( () => {
		const handleMenuClose = ( e ) => {
			// Close the menu if the user presses the Escape key
			// or if they click outside of the menu.
			if (
				( ( 'keyup' === e.type && 27 === e.keyCode ) || 'mouseup' === e.type ) &&
				! menuButtonRef.current.contains( e.target ) &&
				! menuRef.current.contains( e.target )
			) {
				toggleMenu( false );
			}
		};

		const handleDialogClose = ( e ) => {
			// Close if Escape key is pressed.
			if ( 27 === e.keyCode ) {
				toggleDialog( false );
				toggleMenu( false );
			}
		};

		global.addEventListener( 'mouseup', handleMenuClose );
		global.addEventListener( 'keyup', handleMenuClose );
		global.addEventListener( 'keyup', handleDialogClose );

		return () => {
			global.removeEventListener( 'mouseup', handleMenuClose );
			global.removeEventListener( 'keyup', handleMenuClose );
			global.removeEventListener( 'keyup', handleDialogClose );
		};
	}, [] );

	const handleMenu = useCallback( () => {
		toggleMenu( ! menuOpen );
	}, [ menuOpen ] );

	const handleDialog = useCallback( () => {
		toggleDialog( ! dialogActive );
		toggleMenu( false );
	}, [ dialogActive ] );

	const handleMenuItemSelect = useCallback( ( index ) => {
		switch ( index ) {
			case 0:
				handleDialog();
				break;
			case 1:
				if ( proxyPermissionsURL ) {
					global.location.assign( proxyPermissionsURL );
				}
				break;
			default:
				handleMenu();
		}
	}, [ proxyPermissionsURL, handleMenu, handleDialog ] );

	// Log the user out if they confirm the dialog.
	const handleUnlinkConfirm = useCallback( () => {
		// Close the modal.
		toggleDialog( false );

		// Clear caches.
		clearWebStorage();

		// Navigate back to the splash screen to reconnect.
		global.location.assign( postDisconnectURL );
	}, [ postDisconnectURL ] );

	if ( ! userEmail ) {
		return null;
	}

	return (
		<Fragment>
			<div className="googlesitekit-user-selector googlesitekit-dropdown-menu mdc-menu-surface--anchor">
				<Button
					ref={ menuButtonRef }
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
					ref={ menuRef }
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
			<Modal>
				<Dialog
					dialogActive={ dialogActive }
					handleConfirm={ handleUnlinkConfirm }
					handleDialog={ handleDialog }
					title={ __( 'Disconnect', 'google-site-kit' ) }
					subtitle={ __( 'Disconnecting Site Kit by Google will remove your access to all services. After disconnecting, you will need to re-authorize to restore service.', 'google-site-kit' ) }
					confirmButton={ __( 'Disconnect', 'google-site-kit' ) }
					danger
				/>
			</Modal>
		</Fragment>

	);
}

export default UserMenu;
