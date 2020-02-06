/**
 * PostSearcher component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
	find,
	debounce,
	trim,
} from 'lodash';
import Autocomplete from 'accessible-autocomplete/react';
import data, { TYPE_CORE } from 'GoogleComponents/data';
import Button from 'GoogleComponents/button';
import Layout from 'GoogleComponents/layout/layout';
import {
	getSiteKitAdminURL,
} from 'GoogleUtil';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

class PostSearcher extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isSearching: false,
			results: [],
			error: false,
			message: '',
		};
		this.postSearch = this.postSearch.bind( this );
		this.onClick = this.onClick.bind( this );
		this.onConfirm = this.onConfirm.bind( this );
	}

	/**
	 * Search for posts based on user input.
	 *
	 * @param {string} query             The search query.
	 * @param {function} populateResults The callback function to pass the results to.
	 */
	async postSearch( query, populateResults ) {
		populateResults( [ __( 'Loading...', 'google-site-kit' ) ] );

		try {
			const results = await data.get( TYPE_CORE, 'search', 'post-search', { query: encodeURIComponent( query ) } );

			if ( 0 < results.length ) {
				populateResults( map( results, ( result ) => {
					return result.post_title;
				} ) );
			} else {
				populateResults( [ __( 'No results found', 'google-site-kit' ) ] );
			}

			this.setState( {
				isSearching: true,
				results,
				error: false,
				message: '',
			} );
		} catch ( err ) {
			populateResults( [ __( 'No results found', 'google-site-kit' ) ] );

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
	 * @param {string} url
	 *
	 * @return mixed Returns the pathname or false if param is not valid url.
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
		this.setState( {
			selection,
		} );
	}

	onClick() {
		const { results, selection } = this.state;
		const match = find(
			results,
			( result ) => {
				return result.post_title === selection;
			}
		);

		document.location = getSiteKitAdminURL(
			'googlesitekit-dashboard',
			{
				id: match.id,
				permaLink: match.permalink,
				pageTitle: selection,
			}
		);
	}

	render() {
		const { modules } = global.googlesitekit;

		// Set column width full if Analytics active, half otherwise.
		const classNameForColumn = modules.analytics && modules.analytics.active ?
			'mdc-layout-grid__cell mdc-layout-grid__cell--span-12' :
			'mdc-layout-grid__cell mdc-layout-grid__cell--span-4-tablet mdc-layout-grid__cell--span-6-desktop';

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
									<label className="googlesitekit-post-searcher__label" htmlFor="autocomplete">{ __( 'Title or URL', 'google-site-kit' ) }</label>
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
