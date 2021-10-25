/**
 * EntitySearchInput component.
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
import { useInstanceId } from '@wordpress/compose';
import {
	useCallback,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from './Button';
import ProgressBar from './ProgressBar';
import VisuallyHidden from './VisuallyHidden';
import MagnifyingGlass from '../../svg/magnifying-glass.svg';
import CloseDark from '../../svg/close-dark.svg';
import PostSearcherAutoSuggest from './PostSearcherAutoSuggest';
import ViewContextContext from './Root/ViewContextContext';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import { trackEvent } from '../util';

const { useSelect, useDispatch } = Data;

function EntitySearchInput() {
	const instanceID = useInstanceId( EntitySearchInput, 'EntitySearchInput' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( false );

	const onOpen = useCallback( () => {
		setIsOpen( true );
	}, [] );

	const onClose = useCallback( () => {
		setIsOpen( false );
	}, [] );

	const onEscapeKeyDown = useCallback(
		( e ) => {
			if ( e.keyCode === ESCAPE ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const [ match, setMatch ] = useState( {} );
	const viewContext = useContext( ViewContextContext );

	const detailsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
			permaLink: match?.permalink,
		} )
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	useEffect( () => {
		const asyncEffect = async () => {
			if ( match?.permalink ) {
				await trackEvent(
					`${ viewContext }_headerbar`,
					'open_urldetails'
				);

				navigateTo( detailsURL );
			}
		};
		asyncEffect();
	}, [ detailsURL, match, navigateTo, viewContext ] );

	if ( isOpen ) {
		return (
			<div className="googlesitekit-entity-search googlesitekit-dropdown-menu googlesitekit-dropdown-menu__icon-menu">
				<VisuallyHidden>
					<label htmlFor={ instanceID }>
						{ __( 'Page/URL Search', 'google-site-kit' ) }
					</label>
				</VisuallyHidden>
				<PostSearcherAutoSuggest
					id={ instanceID }
					setMatch={ setMatch }
					placeholder={ __(
						'Enter title or URL…',
						'google-site-kit'
					) }
					setIsLoading={ setIsLoading }
					onKeyDown={ onEscapeKeyDown }
					/* eslint-disable-next-line jsx-a11y/no-autofocus */
					autoFocus
				/>
				<Button
					text
					onClick={ onClose }
					trailingIcon={ <CloseDark width="30" height="20" /> }
					className="mdc-button--dropdown googlesitekit-entity-search--close"
				/>
				{ isLoading && (
					<ProgressBar
						className="googlesitekit-entity-search--loading"
						small
						compress
					/>
				) }
			</div>
		);
	}

	return (
		<div className="googlesitekit-dropdown-menu googlesitekit-dropdown-menu__icon-menu">
			<Button
				text
				onClick={ onOpen }
				trailingIcon={ <MagnifyingGlass width="30" height="20" /> }
				className="mdc-button--dropdown"
			>
				{ __( 'URL Search', 'google-site-kit' ) }
			</Button>
		</div>
	);
}

export default EntitySearchInput;
