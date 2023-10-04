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
import { useCallback, useEffect, useState, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { Button, ProgressBar } from 'googlesitekit-components';
import VisuallyHidden from './VisuallyHidden';
import MagnifyingGlass from '../../svg/icons/magnifying-glass.svg';
import CloseDark from '../../svg/icons/close-dark.svg';
import PostSearcherAutoSuggest from './PostSearcherAutoSuggest';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';
import { CORE_LOCATION } from '../googlesitekit/datastore/location/constants';
import { trackEvent } from '../util';
import useDashboardType, {
	DASHBOARD_TYPE_ENTITY,
} from '../hooks/useDashboardType';
import useViewContext from '../hooks/useViewContext';

const { useSelect, useDispatch } = Data;

function EntitySearchInput() {
	const instanceID = useInstanceId( EntitySearchInput, 'EntitySearchInput' );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ isActive, setIsActive ] = useState( false );

	const viewContext = useViewContext();
	const dashboardType = useDashboardType();
	const buttonRef = useRef();

	const onOpen = useCallback( () => {
		trackEvent( `${ viewContext }_headerbar`, 'open_urlsearch' );
		setIsOpen( true );
	}, [ viewContext ] );

	const onClose = useCallback( () => {
		trackEvent( `${ viewContext }_headerbar`, 'close_urlsearch' );
		setIsOpen( false );
	}, [ viewContext ] );

	const [ match, setMatch ] = useState( {} );

	const detailsURL = useSelect( ( select ) =>
		match?.url
			? select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', {
					permaLink: match.url,
			  } )
			: null
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	useEffect( () => {
		if ( detailsURL ) {
			trackEvent(
				`${ viewContext }_headerbar_urlsearch`,
				'open_urldetails'
			).finally( () => {
				navigateTo( detailsURL );
			} );
		}
	}, [ detailsURL, navigateTo, viewContext ] );

	useMount( () => {
		if ( dashboardType === DASHBOARD_TYPE_ENTITY ) {
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
						title={ __( 'Close', 'google-site-kit' ) }
						text
						tooltip
						tooltipEnterDelayInMS={ 500 }
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="googlesitekit-entity-search">
			<Button
				className="googlesitekit-border-radius-round--phone googlesitekit-button-icon--phone"
				onClick={ onOpen }
				text
				ref={ buttonRef }
				title={ __( 'Search', 'google-site-kit' ) }
				trailingIcon={ <MagnifyingGlass width="20" height="20" /> }
				tooltip
				tooltipEnterDelayInMS={ 500 }
			>
				{ __( 'URL Search', 'google-site-kit' ) }
			</Button>
		</div>
	);
}

export default EntitySearchInput;
