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
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ENTER, ESCAPE } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { useDebouncedState } from '../hooks/useDebouncedState';
import { useFeature } from '../hooks/useFeature';
import { CORE_SITE } from '../googlesitekit/datastore/site/constants';

const { useSelect } = Data;

export default function PostSearcherAutoSuggest( {
	id,
	setMatch,
	isLoading,
	setIsLoading,
	autoFocus,
	setCanSubmit = () => {},
	onClose = () => {},
	placeholder = '',
} ) {
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const debouncedValue = useDebouncedState( searchTerm, 200 );
	const [ results, setResults ] = useState( [] );
	const noResultsMessage = __( 'No results found', 'google-site-kit' );

	const unifiedDashboardEnabled = useFeature( 'unifiedDashboard' );

	const currentEntityTitle = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentEntityTitle()
	);

	const onSelectCallback = useCallback(
		( value ) => {
			if ( Array.isArray( results ) && value !== noResultsMessage ) {
				const foundMatch = results.find(
					( post ) =>
						post.post_title.toLowerCase() === value.toLowerCase()
				);
				if ( foundMatch ) {
					setCanSubmit( true );
					setMatch( foundMatch );
					setSearchTerm( foundMatch.post_title );
				}
			} else {
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
		if ( debouncedValue !== '' && debouncedValue !== searchTerm ) {
			setIsLoading?.( true );
			API.get(
				'core',
				'search',
				'post-search',
				{ query: encodeURIComponent( debouncedValue ) },
				{ useCache: false }
			)
				.then( ( res ) => setResults( res ) )
				.catch( () => setResults( [] ) )
				.finally( () => setIsLoading?.( false ) );
		}
	}, [ debouncedValue, setIsLoading, searchTerm ] );

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

	const onKeyDown = useCallback(
		( e ) => {
			if ( ! unifiedDashboardEnabled ) {
				return;
			}
			if ( e.keyCode === ESCAPE ) {
				return onClose();
			}

			if ( e.keyCode === ENTER ) {
				return onSelectCallback( searchTerm );
			}
		},
		[ onClose, onSelectCallback, searchTerm, unifiedDashboardEnabled ]
	);

	return (
		<Combobox
			className="autocomplete__wrapper"
			onSelect={ onSelectCallback }
		>
			<ComboboxInput
				id={ id }
				className="autocomplete__input autocomplete__input--default"
				type="text"
				onChange={ onInputChange }
				placeholder={ placeholder }
				onKeyDown={ onKeyDown }
				value={ searchTerm }
				/* eslint-disable-next-line jsx-a11y/no-autofocus */
				autoFocus={ autoFocus }
			/>

			{ ( ! unifiedDashboardEnabled || ! isLoading ) &&
				debouncedValue !== currentEntityTitle &&
				debouncedValue !== '' &&
				results.length === 0 && (
					<ComboboxPopover portal={ false }>
						<ComboboxList className="autocomplete__menu autocomplete__menu--inline">
							<ComboboxOption
								value={ noResultsMessage }
								className="autocomplete__option"
							/>
						</ComboboxList>
					</ComboboxPopover>
				) }

			{ debouncedValue !== '' &&
				debouncedValue !== currentEntityTitle &&
				results.length > 0 && (
					<ComboboxPopover portal={ false }>
						<ComboboxList className="autocomplete__menu autocomplete__menu--inline">
							{ results.map( ( { ID, post_title: title } ) => (
								<ComboboxOption
									key={ ID }
									value={ title }
									className="autocomplete__option"
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
	setCanSubmit: PropTypes.func,
	setMatch: PropTypes.func,
	isLoading: PropTypes.bool,
	setIsLoading: PropTypes.func,
	onKeyDown: PropTypes.func,
	autoFocus: PropTypes.bool,
	placeholder: PropTypes.string,
};
