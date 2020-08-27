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
	trim,
} from 'lodash';
import Autocomplete from 'accessible-autocomplete/react';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
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

class PostSearcher extends Component {
	constructor( props ) {
		super( props );
		this.noResultsMessage = __( 'No results found', 'google-site-kit' );
		this.state = {
			isSearching: false,
			results: [],
			error: false,
			message: '',
			canSubmit: false,
			match: {},
		};
		this.postSearch = this.postSearch.bind( this );
		this.onClick = this.onClick.bind( this );
		this.onConfirm = this.onConfirm.bind( this );
	}

	/**
	 * Search for posts based on user input.
	 *
	 * @param {string} query             The search query.
	 * @param {Function} populateResults The callback function to pass the results to.
	 */
	async postSearch( query, populateResults ) {
		populateResults( [ __( 'Loading…', 'google-site-kit' ) ] );

		try {
			const results = await data.get( TYPE_CORE, 'search', 'post-search', { query: encodeURIComponent( query ) } );

			if ( 0 < results.length ) {
				populateResults( map( results, ( result ) => {
					return result.post_title;
				} ) );
			} else {
				populateResults( [ this.noResultsMessage ] );
			}

			this.setState( {
				isSearching: true,
				results,
				error: false,
				message: '',
			} );
		} catch ( err ) {
			populateResults( [ this.noResultsMessage ] );

			this.setState( {
				isSearching: false,
				error: err.code,
				message: err.message,
			} );
		}
	}

	/**
	 * Return the pathname of URL.
	 *
	 * @param {string} url URL to parse pathname from.
	 *
	 * @return {string} Returns the pathname or false if param is not a valid URL.
	 */
	getURLPathname( url ) {
		try {
			const parseURL = new URL( url );
			return trim( parseURL.pathname, '/' );
		} catch {
			return false;
		}
	}

	onConfirm( selection ) {
		const { results } = this.state;
		// Check that the selection is "valid".
		if ( Array.isArray( results ) && selection !== this.noResultsMessage ) {
			const match = results.find( ( result ) => result.post_title === selection );
			if ( selection && match ) {
				this.setState( {
					selection,
					canSubmit: true,
					match,
				} );
			}
		} else {
			this.setState( {
				canSubmit: false,
			} );
		}
	}

	onClick() {
		const { match } = this.state;
		if ( match?.permalink ) {
			global.location.assign( getSiteKitAdminURL(
				'googlesitekit-dashboard',
				{
					permaLink: match.permalink,
				}
			) );
		}
	}

	render() {
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
										source={ debounce( this.postSearch, 200 ) }
										minLength={ 2 }
										onConfirm={ this.onConfirm }
										showNoOptionsFound={ false }
									/>
									<div className="googlesitekit-post-searcher__button-wrapper">
										<Button
											onClick={ this.onClick }
											className="googlesitekit-post-searcher__button"
											disabled={ ! this.state.canSubmit }
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
	}
}

export default PostSearcher;
