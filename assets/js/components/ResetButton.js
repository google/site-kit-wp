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
import { Fragment, useState, useEffect, useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import {
	clearWebStorage,
	sanitizeHTML,
} from '../util';
import Dialog from './dialog';
import Modal from './Modal';
import Link from './Link';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
const { useSelect, useDispatch } = Data;

function ResetButton( { children } ) {
	const splashURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-splash' ) );

	const [ dialogActive, setDialogActive ] = useState( false );
	const postResetURL = addQueryArgs( splashURL, { notification: 'reset_success' } );

	const { reset: resetCoreSite } = useDispatch( CORE_SITE );

	const handleCloseModal = useCallback( ( event ) => {
		if ( 27 === event.keyCode ) {
			setDialogActive( false );
		}
	}, [ dialogActive ] );

	useEffect( () => {
		global.addEventListener( 'keyup', handleCloseModal, false );

		return () => global.removeEventListener( 'keyup', handleCloseModal );
	}, [ handleCloseModal ] );

	const handleUnlinkConfirm = async () => {
		resetCoreSite();
		clearWebStorage();
		handleDialog();
		global.location.href = postResetURL;
	};

	const handleDialog = () => {
		setDialogActive( ( prevDialogActive ) => {
			return ! prevDialogActive;
		} );
	};

	const subtitle = __( `Resetting will disconnect all users and remove all Site Kit settings and data within WordPress. <br />You and any other users who wish to use Site Kit will need to reconnect to restore access.`, 'google-site-kit' );
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
					handleDialog={ handleDialog }
					title={ __( 'Reset Site Kit', 'google-site-kit' ) }
					subtitle={ (
						<span dangerouslySetInnerHTML={ sanitizeHTML( subtitle, {
							ALLOWED_TAGS: [ 'br' ],
						} ) } />
					) }
					confirmButton={ __( 'Reset', 'google-site-kit' ) }
					provides={ [] }
					danger
				/>
			</Modal>
		</Fragment>
	);
}

export default ResetButton;
