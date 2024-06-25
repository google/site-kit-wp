/**
 * PostSearcherAutoSuggest component.
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
import PropTypes from 'prop-types';
import {
	Combobox,
	ComboboxInput,
	ComboboxPopover,
	ComboboxList,
	ComboboxOption,
} from '@reach/combobox';

/**
 * WordPress dependencies
 */
import { useState, useEffect, useCallback, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { END, ENTER, ESCAPE, HOME } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { useSelect } from 'googlesitekit-data';
import { useDebouncedState } from '../hooks/useDebouncedState';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';

const noop = () => {};

export default function PostSearcherAutoSuggest( {
	id,
	match,
	setMatch,
	isLoading,
	showDropdown = true,
	setIsLoading = noop,
	setIsActive = noop,
	autoFocus,
	setCanSubmit = noop,
	onClose = noop,
	placeholder = '',
} ) {
	const lastFetchRequest = useRef();
	const [ searchTerm, setSearchTerm ] = useState( '' );

	// eslint-disable-next-line camelcase
	const postTitleFromMatch = match?.title;
	/**
	 * As a fix for #4562, we should hide the loading indicator
	 * after pressing enter/return key on a URL Entity Search Result.
	 *
	 * In the useEffect condition we check for:
	 * `debouncedValue !== postTitleFromMatch` to set the loading state to true.
	 * However, the `debouncedValue` is always delayed. Hence this condition is always true.
	 * Hence the loading state is to true.
	 * Therefore, we need to set the debounce delay/timer value to `0` if the
	 * `searchTerm === postTitleFromMatch` to not to set the loading state to true.
	 */
	const debouncedValue = useDebouncedState(
		searchTerm,
		searchTerm === postTitleFromMatch ? 0 : 200
	);

	const [ results, setResults ] = useState( [] );
	const noResultsMessage = __( 'No results found', 'google-site-kit' );

	const currentEntityTitle = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityTitle()
	);

	const postTitle = useRef( null );

	const onFocus = useCallback( () => {
		setIsActive( true );
	}, [ setIsActive ] );

	const onBlur = useCallback(
		( event ) => {
			if (
				! event.relatedTarget?.classList.contains(
					'autocomplete__option--result'
				)
			) {
				setIsActive( false );
				setSearchTerm( postTitle.current ?? currentEntityTitle ?? '' );
			}
		},
		[ currentEntityTitle, setIsActive ]
	);

	const onSelectCallback = useCallback(
		( value ) => {
			if ( Array.isArray( results ) && value !== noResultsMessage ) {
				const foundMatch = results.find(
					( post ) => post.title.toLowerCase() === value.toLowerCase()
				);
				if ( foundMatch ) {
					postTitle.current = foundMatch.title;
					setCanSubmit( true );
					setMatch( foundMatch );
					setSearchTerm( foundMatch.title );
				} else {
					postTitle.current = null;
				}
			} else {
				postTitle.current = null;
				setCanSubmit( false );
			}
		},
		[ results, setCanSubmit, setMatch, noResultsMessage, setSearchTerm ]
	);

	const onInputChange = useCallback(
		( event ) => {
			setCanSubmit( false );
			setSearchTerm( event.target.value );
		},
		[ setCanSubmit ]
	);

	useEffect( () => {
		if (
			debouncedValue !== '' &&
			debouncedValue !== currentEntityTitle &&
			debouncedValue?.toLowerCase() !== postTitleFromMatch?.toLowerCase()
		) {
			/**
			 * Create AbortController instance to pass
			 * the signal property to the API.get() method.
			 */
			const controller =
				typeof AbortController === 'undefined'
					? undefined
					: new AbortController();

			( async function request() {
				setIsLoading( true );

				const fetchPromise = API.get(
					'core',
					'search',
					'entity-search',
					{ query: encodeURIComponent( debouncedValue ) },
					{ useCache: false, signal: controller?.signal }
				);
				lastFetchRequest.current = fetchPromise;

				try {
					const response = await fetchPromise;
					setResults( response );
				} catch {
					setResults( null );
				} finally {
					if ( fetchPromise === lastFetchRequest.current ) {
						setIsLoading( false );
					}
				}
			} )();

			// Clean-up abort
			return () => controller?.abort();
		}
	}, [
		debouncedValue,
		setIsLoading,
		currentEntityTitle,
		postTitleFromMatch,
	] );

	useEffect( () => {
		if ( ! searchTerm ) {
			setResults( [] );
		}
	}, [ searchTerm ] );

	useEffect( () => {
		if ( currentEntityTitle ) {
			setSearchTerm( currentEntityTitle );
		}
	}, [ currentEntityTitle ] );

	const inputRef = useRef();

	const onKeyDown = useCallback(
		( e ) => {
			const input = inputRef.current;

			switch ( e.keyCode ) {
				case HOME:
					if ( input?.value ) {
						e.preventDefault();
						input.selectionStart = 0;
						input.selectionEnd = 0;
					}
					break;
				case END:
					if ( input?.value ) {
						e.preventDefault();
						input.selectionStart = input.value.length;
						input.selectionEnd = input.value.length;
					}
					break;
				default:
					break;
			}

			switch ( e.keyCode ) {
				case ESCAPE:
					return onClose();
				case ENTER:
					return onSelectCallback( searchTerm );
				default:
					break;
			}
		},
		[ onClose, onSelectCallback, searchTerm ]
	);

	return (
		<Combobox
			className="autocomplete__wrapper"
			onSelect={ onSelectCallback }
		>
			<ComboboxInput
				ref={ inputRef }
				id={ id }
				className="autocomplete__input autocomplete__input--default"
				type="text"
				onBlur={ onBlur }
				onChange={ onInputChange }
				onFocus={ onFocus }
				placeholder={ placeholder }
				onKeyDown={ onKeyDown }
				value={ searchTerm }
				/* eslint-disable-next-line jsx-a11y/no-autofocus */
				autoFocus={ autoFocus }
			/>

			{ ! isLoading &&
				showDropdown &&
				debouncedValue !== currentEntityTitle &&
				debouncedValue !== '' &&
				results?.length === 0 && (
					<ComboboxPopover portal={ false }>
						<ComboboxList className="autocomplete__menu autocomplete__menu--inline">
							<ComboboxOption
								value={ noResultsMessage }
								className="autocomplete__option autocomplete__option--no-results"
							/>
						</ComboboxList>
					</ComboboxPopover>
				) }

			{ showDropdown &&
				debouncedValue !== '' &&
				debouncedValue !== currentEntityTitle &&
				results?.length > 0 && (
					<ComboboxPopover portal={ false }>
						<ComboboxList className="autocomplete__menu autocomplete__menu--inline">
							{ results.map( ( { id: ID, title } ) => (
								<ComboboxOption
									key={ ID }
									value={ title }
									className="autocomplete__option autocomplete__option--result"
								/>
							) ) }
						</ComboboxList>
					</ComboboxPopover>
				) }
		</Combobox>
	);
}

PostSearcherAutoSuggest.propTypes = {
	id: PropTypes.string,
	match: PropTypes.object,
	setCanSubmit: PropTypes.func,
	setMatch: PropTypes.func,
	isLoading: PropTypes.bool,
	setIsLoading: PropTypes.func,
	onKeyDown: PropTypes.func,
	autoFocus: PropTypes.bool,
	placeholder: PropTypes.string,
};
