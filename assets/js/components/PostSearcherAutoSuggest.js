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

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { useDebouncedState } from '../hooks/useDebouncedState';

export default function PostSearcherAutoSuggest( { id, setCanSubmit, setMatch } ) {
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const debouncedValue = useDebouncedState( searchTerm, 200 );
	const [ results, setResults ] = useState( [] );
	const noResultsMessage = __( 'No results found', 'google-site-kit' );

	const onSelectCallback = useCallback( ( value ) => {
		if ( Array.isArray( results ) && value !== noResultsMessage ) {
			const foundMatch = results.find( ( post ) => post.post_title === value );
			if ( foundMatch ) {
				setCanSubmit( true );
				setMatch( foundMatch );
			}
		} else {
			setCanSubmit( false );
		}
	}, [ results, setCanSubmit, setMatch, noResultsMessage ] );

	const onInputChange = useCallback( ( event ) => {
		setCanSubmit( false );
		setSearchTerm( event.target.value );
	}, [ setCanSubmit ] );

	useEffect( () => {
		if ( debouncedValue !== '' ) {
			API.get(
				'core', 'search', 'post-search',
				{ query: encodeURIComponent( debouncedValue ) },
				{ useCache: false },
			)
				.then( setResults )
				.catch( () => setResults( [] ) )
			;
		}
	}, [ debouncedValue, setResults ] );

	return (
		<Combobox className="autocomplete__wrapper" onSelect={ onSelectCallback }>
			<ComboboxInput
				id={ id }
				className="autocomplete__input autocomplete__input--default"
				type="text"
				onChange={ onInputChange }
			/>

			{ ( debouncedValue !== '' ) && (
				<ComboboxPopover portal={ false }>
					<ComboboxList className="autocomplete__menu autocomplete__menu--inline">
						{ results.length > 0 ? (
							results.map( ( { ID, post_title: title } ) => <ComboboxOption key={ ID } value={ title } className="autocomplete__option" /> )
						) : (
							<ComboboxOption value={ noResultsMessage } className="autocomplete__option" />
						) }
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
};
