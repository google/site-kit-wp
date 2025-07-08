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
import {
	Fragment,
	createInterpolateElement,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import { ESCAPE } from '@wordpress/keycodes';
import { useDebounce } from '../hooks/useDebounce';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import ModalDialog from './ModalDialog';
import { clearCache } from '../googlesitekit/api/cache';
import Portal from './Portal';
import Link from './Link';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import { trackEvent } from '../util/tracking';
import useViewContext from '../hooks/useViewContext';

function ResetButton( { children } ) {
	const postResetURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-splash', {
			notification: 'reset_success',
		} )
	);
	const isDoingReset = useSelect( ( select ) =>
		select( CORE_SITE ).isDoingReset()
	);
	const isNavigatingToPostResetURL = useSelect( ( select ) =>
		select( CORE_LOCATION ).isNavigatingTo( postResetURL || '' )
	);
	const [ inProgress, setInProgress ] = useState( false );
	const [ dialogActive, setDialogActive ] = useState( false );

	/*
	 * Using debounce here because the spinner has to render across two separate calls.
	 * Rather than risk it flickering on and off in between the reset call completing and
	 * the navigate call starting, we will just set a debounce to keep the spinner for 3 seconds.
	 */
	const debouncedSetInProgress = useDebounce( setInProgress, 3000 );

	useEffect( () => {
		if ( isDoingReset || isNavigatingToPostResetURL ) {
			setInProgress( true );
		} else {
			debouncedSetInProgress( false );
		}
	}, [ isDoingReset, isNavigatingToPostResetURL, debouncedSetInProgress ] );

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

	const viewContext = useViewContext();

	const handleUnlinkConfirm = useCallback( async () => {
		await reset();
		await clearCache();
		await trackEvent( viewContext, 'reset_plugin' );
		navigateTo( postResetURL );
	}, [ navigateTo, postResetURL, reset, viewContext ] );

	const openDialog = useCallback( () => {
		setDialogActive( true );
	}, [] );

	const closeDialog = useCallback( () => {
		setDialogActive( false );
	}, [] );

	return (
		<Fragment>
			<Link className="googlesitekit-reset-button" onClick={ openDialog }>
				{ children || __( 'Reset Site Kit', 'google-site-kit' ) }
			</Link>
			<Portal>
				<ModalDialog
					dialogActive={ dialogActive }
					handleConfirm={ handleUnlinkConfirm }
					handleCancel={ closeDialog }
					onClose={ closeDialog }
					title={ __( 'Reset Site Kit', 'google-site-kit' ) }
					subtitle={ createInterpolateElement(
						__(
							'Resetting will disconnect all users and remove all Site Kit settings and data within WordPress. <br />You and any other users who wish to use Site Kit will need to reconnect to restore access.',
							'google-site-kit'
						),
						{
							br: <br />,
						}
					) }
					confirmButton={ __( 'Reset', 'google-site-kit' ) }
					inProgress={ inProgress }
					danger
					small
				/>
			</Portal>
		</Fragment>
	);
}

export default ResetButton;
