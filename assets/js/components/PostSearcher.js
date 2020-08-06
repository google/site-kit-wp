/**
 * PostSearcher component.
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
	map,
	debounce,
} from 'lodash';
import Autocomplete from 'accessible-autocomplete/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	getSiteKitAdminURL,
	getModulesData,
} from '../util';
import data, { TYPE_CORE } from './data';
import Button from './button';
import Layout from './layout/layout';

const PostSearcher = () => {
	// eslint-disable-next-line no-unused-vars
	const [ isSearching, setIsSearching ] = useState( false );
	const [ results, setResults ] = useState( [] );
	// eslint-disable-next-line no-unused-vars
	const [ error, setError ] = useState( false );
	// eslint-disable-next-line no-unused-vars
	const [ message, setMessage ] = useState( 'test' );
	const [ canSubmit, setCanSubmit ] = useState( false );
	const [ match, setMatch ] = useState( {} );
	const [ selection, setSelection ] = useState();
	const noResultsMessage = __( 'No results found', 'google-site-kit' );

	/**
	 * Search for posts based on user input.
	 *
	 * @param {string} query             The search query.
	 * @param {Function} populateResults The callback function to pass the results to.
	 */
	const postSearch = async ( query, populateResults ) => {
		populateResults( [ __( 'Loading…', 'google-site-kit' ) ] );

		try {
			const queryResults = await data.get( TYPE_CORE, 'search', 'post-search', { query: encodeURIComponent( query ) } );

			if ( 0 < queryResults.length ) {
				populateResults( map( queryResults, ( result ) => {
					return result.post_title;
				} ) );
			} else {
				populateResults( [ noResultsMessage ] );
			}
			setIsSearching( true );
			setResults( results );
			setError( false );
			setMessage( '' );
		} catch ( err ) {
			populateResults( [ noResultsMessage ] );
			setIsSearching( false );
			setError( err.code );
			setMessage( err.message );
		}
	};

	const onConfirm = ( selected ) => {
		// Check that the selection is "valid".
		if ( Array.isArray( results ) && selected !== noResultsMessage ) {
			const foundMatch = results.find( ( result ) => result.post_title === selected );
			if ( selected && foundMatch ) {
				setSelection( selected );
				setCanSubmit( true	);
				setMatch( foundMatch );
			}
		} else {
			setCanSubmit( false );
		}
	};

	const onClick = () => {
		if ( match && match.ID ) {
			global.location.assign( getSiteKitAdminURL(
				'googlesitekit-dashboard',
				{
					id: match.ID,
					permaLink: match.permalink,
					pageTitle: selection,
				}
			) );
		}
	};

	const modules = getModulesData();

	// Set column width full if Analytics active, half otherwise.
	const classNameForColumn = modules.analytics && modules.analytics.active
		? 'mdc-layout-grid__cell mdc-layout-grid__cell--span-12'
		: 'mdc-layout-grid__cell mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-6-desktop';

	return (
		<div
			className={ classNameForColumn }
		>
			<Layout
				title={ __( 'Search for individual page or post information', 'google-site-kit' ) }
				header
			>
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
							<div className="googlesitekit-post-searcher">
								<label className="googlesitekit-post-searcher__label" htmlFor="autocomplete">
									{ __( 'Title or URL', 'google-site-kit' ) }
								</label>
								<Autocomplete
									id="autocomplete"
									source={ debounce( postSearch, 200 ) }
									minLength={ 2 }
									onConfirm={ onConfirm }
									showNoOptionsFound={ false }
								/>
								<div className="googlesitekit-post-searcher__button-wrapper">
									<Button
										onClick={ onClick }
										className="googlesitekit-post-searcher__button"
										disabled={ ! canSubmit }
									>
										{ __( 'View Data', 'google-site-kit' ) }
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</Layout>
		</div>
	);
};

export default PostSearcher;
