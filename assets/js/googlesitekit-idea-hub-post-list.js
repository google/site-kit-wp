/**
 * Idea Hub Post List notice.
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
import domReady from '@wordpress/dom-ready';
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_USER } from './googlesitekit/datastore/user/constants';
import { VIEW_CONTEXT_POSTS_LIST } from './googlesitekit/constants';
import { IDEA_HUB_GA_CATEGORY_POSTS } from './modules/idea-hub/datastore/constants';
import { trackEvent } from './util';
import Root from './components/Root';
const { dispatch } = Data;

const WEEK_IN_SECONDS = 3600 * 24 * 7;

domReady( () => {
	const notice = document.querySelector(
		'[id="googlesitekit-notice-idea-hub_new-ideas"],[id="googlesitekit-notice-idea-hub_saved-ideas"]'
	);

	if ( ! notice ) {
		return;
	}

	const type = notice.id.replace( 'googlesitekit-notice-', '' );
	const expiresInSeconds =
		type === 'idea-hub_new-ideas' ? WEEK_IN_SECONDS : 0;

	trackEvent(
		IDEA_HUB_GA_CATEGORY_POSTS,
		type === 'idea-hub_saved-ideas'
			? 'savedposts_notification_view'
			: 'newposts_notification_view'
	);

	notice.addEventListener( 'click', ( { target } ) => {
		if ( target.classList.contains( 'notice-dismiss' ) ) {
			dispatch( CORE_USER ).dismissItem( type, { expiresInSeconds } );

			trackEvent(
				IDEA_HUB_GA_CATEGORY_POSTS,
				type === 'idea-hub_saved-ideas'
					? 'savedposts_notification_dismiss'
					: 'newposts_notification_dismiss'
			);
		} else if (
			target.classList.contains( 'googlesitekit-idea-hub__saved-ideas' )
		) {
			trackEvent(
				IDEA_HUB_GA_CATEGORY_POSTS,
				'savedposts_notification_complete'
			);
		} else if (
			target.classList.contains( 'googlesitekit-idea-hub__new-ideas' )
		) {
			trackEvent(
				IDEA_HUB_GA_CATEGORY_POSTS,
				'newposts_notification_complete'
			);
		}
	} );
} );

domReady( () => {
	const renderTarget = document.getElementById(
		'js-googlesitekit-post-list'
	);

	if ( renderTarget ) {
		render(
			<Root viewContext={ VIEW_CONTEXT_POSTS_LIST } />,
			renderTarget
		);
	}
} );
