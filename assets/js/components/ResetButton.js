/**
 * ResetButton component.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, useState, useEffect, useCallback, createInterpolateElement } from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { clearWebStorage } from '../util';
import Dialog from './Dialog';
import Modal from './Modal';
import Link from './Link';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
const { useSelect, useDispatch } = Data;

function ResetButton( { children } ) {
	const postResetURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-splash', { notification: 'reset_success' } ) );

	// Sketching this in for now, these selectors will be added as part of #2497
	// useSelect( ( select ) => select( CORE_LOCATION ).isNavigating() )
	// useSelect( ( select ) => select( CORE_LOCATION ).getNavigationURL() )
	const isNavigating = false;
	const navigatingURL = postResetURL;

	const [ dialogActive, setDialogActive ] = useState( false );

	useEffect( () => {
		const handleCloseModal = ( event ) => {
			if ( ESCAPE === event.keyCode ) {
				// Only close the modal if the "Escape" key is pressed.
				setDialogActive( false );
			}
		};

		if ( dialogActive ) {
			// When the dialogActive changes and it is set to true(has opened), add the event listener.
			global.addEventListener( 'keyup', handleCloseModal, false );
		}
		// Remove the event listener when the dialog is removed; there's no need
		// to have it attached when it won't be used.
		return () => {
			if ( dialogActive ) {
				// When the dialogActive is true(is open) and its value changes, remove the event listener.
				global.removeEventListener( 'keyup', handleCloseModal );
			}
		};
	}, [ dialogActive ] );

	const { reset } = useDispatch( CORE_SITE );
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const handleUnlinkConfirm = useCallback( async () => {
		await reset();
		clearWebStorage();
		navigateTo( postResetURL );
	}, [ reset, postResetURL ] );

	const toggleDialogActive = useCallback( () => {
		setDialogActive( ! dialogActive );
	}, [ dialogActive ] );

	const openDialog = useCallback( () => {
		setDialogActive( true );
	}, [] );

	const showSpinner = isNavigating && postResetURL === navigatingURL;

	return (
		<Fragment>
			<Link
				className="googlesitekit-reset-button"
				onClick={ openDialog }
				inherit
			>
				{ children || __( 'Reset Site Kit', 'google-site-kit' ) }
			</Link>
			<Modal>
				<Dialog
					dialogActive={ dialogActive }
					handleConfirm={ handleUnlinkConfirm }
					handleDialog={ toggleDialogActive }
					title={ __( 'Reset Site Kit', 'google-site-kit' ) }
					subtitle={ createInterpolateElement(
						__( `Resetting will disconnect all users and remove all Site Kit settings and data within WordPress. <br />You and any other users who wish to use Site Kit will need to reconnect to restore access.`, 'google-site-kit' ),
						{
							br: <br />,
						} ) }
					confirmButton={ __( 'Reset', 'google-site-kit' ) }
					danger
					showSpinner={ showSpinner }
				/>
			</Modal>
		</Fragment>
	);
}

export default ResetButton;
