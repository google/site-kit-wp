/**
 * PostSearcherAutoSuggest component.
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
 * External dependencies
 */
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
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';

/**
 * useDebounce hook
 *
 * @param {string} value The value to be debounced.
 * @param {number} delay Number of milliseconds to debounce
 * @return {string} The update value after the delay
 */
const useDebounce = ( value, delay ) => {
	const [ debouncedValue, setDebouncedValue ] = useState( value );

	useEffect(
		() => {
			// Update debounced value after the delay
			const timeout = setTimeout( () => {
				setDebouncedValue( value );
			}, delay );

			return () => {
				clearTimeout( timeout );
			};
		},
		[ value, delay ]
	);

	return debouncedValue;
};

const PostSearcherAutoSuggest = ( { setCanSubmit, setMatch } ) => {
	const [ searchTerm, setSearchTerm ] = useState( '' );
	const debouncedValue = useDebounce( searchTerm, 200 );
	const [ results, setResults ] = useState( [] );
	const noResultsMessage = __( 'No results found', 'google-site-kit' );

	const postSearch = async ( query ) => {
		try {
			const queryResults = await API.get( 'core', 'search', 'post-search', { query: encodeURIComponent( query ) } );
			if ( 0 < queryResults.length ) {
				setResults( queryResults );
			} else {
				setResults( [] );
			}
		} catch ( err ) {
			setResults( [] );
		}
	};

	useEffect( () => {
		if ( debouncedValue !== '' ) {
			postSearch( debouncedValue );
		}
	}, [ debouncedValue ] );

	return (
		<Combobox
			className="autocomplete__wrapper"
			onSelect={ ( value ) => {
				if ( Array.isArray( results ) && value !== noResultsMessage ) {
					const foundMatch = results.find( ( post ) => post.post_title === value );
					if ( foundMatch ) {
						setCanSubmit( true );
						setMatch( foundMatch );
					}
				} else {
					setCanSubmit( false );
				}
			} }
		>
			<ComboboxInput
				id="autocomplete"
				className="autocomplete__input autocomplete__input--default"
				type="text"
				onChange={ ( evt ) => {
					setCanSubmit( false );
					setSearchTerm( evt.target.value );
				} }
			/>

			{ ( debouncedValue !== '' ) && (
				<ComboboxPopover portal={ false }>
					<ComboboxList className="autocomplete__menu autocomplete__menu--inline">
						{ results.length > 0 ? (
							results.map( ( { ID, post_title: title } ) => <ComboboxOption key={ ID } value={ title } className="autocomplete__option" /> )
						) : (
							<ComboboxOption value={ 'No results found' } className="autocomplete__option" />
						) }
					</ComboboxList>
				</ComboboxPopover>
			) }
		</Combobox>
	);
};

export default PostSearcherAutoSuggest;
