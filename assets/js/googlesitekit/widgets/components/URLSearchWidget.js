/**
 * URLSearchWidget component.
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
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../datastore/site/constants';
import { CORE_LOCATION } from '../../datastore/location/constants';
import Button from '../../../components/Button';
import PostSearcherAutoSuggest from '../../../components/PostSearcherAutoSuggest';
const { useSelect, useDispatch } = Data;

function URLSearchWidget( { Widget } ) {
	const [ canSubmit, setCanSubmit ] = useState( false );
	const [ match, setMatch ] = useState( {} );

	const detailsURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard', { permaLink: match?.permalink } ) );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const onClick = useCallback( () => {
		if ( match?.permalink ) {
			navigateTo( detailsURL );
		}
	}, [ detailsURL, match, navigateTo ] );

	return (
		<div className="mdc-layout-grid__cell">
			<Widget
				Header={ () => (
					<h3 className="googlesitekit-subheading-1 googlesitekit-widget__header-title">
						{ __( 'Search for individual page or post information', 'google-site-kit' ) }
					</h3>
				) }
				noPadding
			>
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">
						<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
							<div className="googlesitekit-post-searcher">
								<label className="googlesitekit-post-searcher__label" htmlFor="urlsearch-autocomplete">
									{ __( 'Title or URL', 'google-site-kit' ) }
								</label>
								<PostSearcherAutoSuggest
									id="urlsearch-autocomplete"
									setCanSubmit={ setCanSubmit }
									setMatch={ setMatch }
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
			</Widget>
		</div>
	);
}

export default URLSearchWidget;
