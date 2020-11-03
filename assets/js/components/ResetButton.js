/**
 * ResetButton component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { clearWebStorage } from '../util';
import Dialog from './dialog';
import Modal from './Modal';
import Link from './Link';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
const { useSelect, useDispatch } = Data;

function ResetButton( { children } ) {
	const splashURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-splash' ) );

	const [ dialogActive, setDialogActive ] = useState( false );
	const postResetURL = addQueryArgs( splashURL, { notification: 'reset_success' } );

	const { reset } = useDispatch( CORE_SITE );

	const handleCloseModal = useCallback( ( event ) => {
		if ( 27 === event.keyCode ) {
			// Only close the modal if the "Escape" key is pressed.
			setDialogActive( false );
		}
	} );

	useEffect( () => {
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

	const handleUnlinkConfirm = async () => {
		reset();
		clearWebStorage();
		setDialogActive( false );
		global.location.href = postResetURL;
	};

	const toggleDialogActive = () => {
		setDialogActive( ! dialogActive );
	};

	return (
		<Fragment>
			<Link
				className="googlesitekit-reset-button"
				onClick={ () => setDialogActive( true ) }
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
					provides={ [] }
					danger
				/>
			</Modal>
		</Fragment>
	);
}

export default ResetButton;
