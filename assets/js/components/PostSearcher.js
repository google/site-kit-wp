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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import Button from './button';
import Layout from './layout/layout';
import { STORE_NAME as CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { STORE_NAME as CORE_SITE } from '../googlesitekit/datastore/site/constants';
import PostSearcherAutoSuggest from './PostSearcherAutoSuggest';

const { useSelect } = Data;

const PostSearcher = () => {
	const [ canSubmit, setCanSubmit ] = useState( false );
	const [ match, setMatch ] = useState( {} );
	const adminURL = useSelect( ( select ) => select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ) );

	const onClick = () => {
		if ( match && match.ID && adminURL ) {
			const { ID: id, permalink: permaLink, post_title: pageTitle } = match;
			global.location.assign( addQueryArgs( adminURL, {
				id,
				permaLink,
				pageTitle,
			} ) );
		}
	};

	const modules = useSelect( ( select ) => select( CORE_MODULES ).getModules() );
	// Set column width full if Analytics active, half otherwise.
	const classNameForColumn = modules?.analytics?.active
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
								<PostSearcherAutoSuggest
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
			</Layout>
		</div>
	);
};

export default PostSearcher;
