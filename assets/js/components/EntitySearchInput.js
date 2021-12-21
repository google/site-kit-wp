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
 * External dependencies
 */
import { useMount, useUpdateEffect } from 'react-use';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	useCallback,
	useContext,
	useEffect,
	useState,
	useRef,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
import { VIEW_CONTEXT_PAGE_DASHBOARD } from '../googlesitekit/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import { trackEvent } from '../util';

const { useSelect, useDispatch } = Data;

function EntitySearchInput() {
	const instanceID = useInstanceId( EntitySearchInput, 'EntitySearchInput' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isActive, setIsActive ] = useState( false );

	const buttonRef = useRef();

	const onOpen = useCallback( () => {
		setIsOpen( true );
	}, [] );

	const onClose = useCallback( () => {
		setIsOpen( false );
	}, [] );

	const [ match, setMatch ] = useState( {} );
	const viewContext = useContext( ViewContextContext );

	const detailsURL = useSelect( ( select ) =>
		match?.permalink
			? select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
					permaLink: match.permalink,
			  } )
			: null
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	useEffect( () => {
		if ( detailsURL ) {
			trackEvent(
				`${ viewContext }_headerbar`,
				'open_urldetails'
			).finally( () => {
				navigateTo( detailsURL );
			} );
		}
	}, [ detailsURL, navigateTo, viewContext ] );

	useMount( () => {
		if ( viewContext === VIEW_CONTEXT_PAGE_DASHBOARD ) {
			setIsOpen( true );
		}
	} );

	useUpdateEffect( () => {
		if ( ! isOpen ) {
			buttonRef?.current?.focus();
		}
	}, [ isOpen ] );

	if ( isOpen ) {
		return (
			<div className="googlesitekit-entity-search googlesitekit-entity-search--is-open">
				<VisuallyHidden>
					<label htmlFor={ instanceID }>
						{ __( 'Page/URL Search', 'google-site-kit' ) }
					</label>
				</VisuallyHidden>
				<PostSearcherAutoSuggest
					id={ instanceID }
					match={ match }
					setIsActive={ setIsActive }
					setMatch={ setMatch }
					placeholder={ __(
						'Enter title or URL…',
						'google-site-kit'
					) }
					isLoading={ isLoading }
					setIsLoading={ setIsLoading }
					showDropdown={ isActive }
					onClose={ onClose }
					/* eslint-disable-next-line jsx-a11y/no-autofocus */
					autoFocus
				/>
				{ isLoading && isActive && (
					<ProgressBar
						className="googlesitekit-entity-search__loading"
						compress
					/>
				) }

				<div className="googlesitekit-entity-search__actions">
					<Button
						onClick={ onClose }
						trailingIcon={ <CloseDark width="30" height="20" /> }
						className="googlesitekit-entity-search__close"
						text
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="googlesitekit-entity-search">
			<Button
				onClick={ onOpen }
				text
				ref={ buttonRef }
				trailingIcon={ <MagnifyingGlass width="16" height="16" /> }
			>
				{ __( 'URL Search', 'google-site-kit' ) }
			</Button>
		</div>
	);
}

export default EntitySearchInput;
