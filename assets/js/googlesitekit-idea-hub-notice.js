/**
 * Idea Hub Notice (for Block Editor) entrypoint.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getItem, setItem } from './googlesitekit/api/cache';

const shownNotices = [];

const editorNoticeKey = ( postID ) => {
	return `modules::idea-hub::dismissed-editor-notice-${ postID }`;
};

const loadIdeaHubNotices = async ( _global = global ) => {
	const { wp } = _global;

	const hasNotice = ( postID ) => {
		if ( wp.data.select( 'core/notices' ).getNotices() === undefined ) {
			return undefined;
		}

		return wp.data.select( 'core/notices' ).getNotices().some( ( notice ) => {
			return notice.id === editorNoticeKey( postID );
		} );
	};

	const listener = async () => {
		// eslint-disable-next-line sitekit/acronym-case
		const postID = wp.data.select( 'core/editor' ).getCurrentPostId();

		if ( ! postID ) {
			return;
		}

		const { cacheHit } = await getItem( editorNoticeKey( postID ) );

		if ( hasNotice( postID ) === false ) {
			// We've already shown this notice, so when it's hidden, mark it as shown
			// so it doesn't appear again.
			if ( shownNotices.includes( editorNoticeKey( postID ) ) ) {
				setItem(
					editorNoticeKey( postID ),
					postMeta.googlesitekitpersistent_idea_text,
					{ ttl: 108000 } // Don't show this notice for another 90 days.
				);
				unsubscribeFromListener();
				return;
			}

			// We've already shown this notice on a previous visit to this page in
			// the editor, so don't show it again.
			if ( cacheHit ) {
				unsubscribeFromListener();
				return;
			}

			// We haven't shown any notice for this post before, so let's check for
			// Idea Hub postmeta.
			const postMeta = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' );

			// eslint-disable-next-line camelcase
			if ( postMeta?.googlesitekitpersistent_idea_text ) {
				wp.data.dispatch( 'core/notices' ).createInfoNotice(
					/* translators: %s: Idea post name */
					sprintf( __( 'This post was created from an idea you picked in Site Kit’s Idea Hub: %s', 'google-site-kit' ), postMeta.googlesitekitpersistent_idea_text ),
					{ id: editorNoticeKey( postID ) }
				);

				// Mark the notice as shown locally, so if it is no longer marked as
				// visible, we known it was dismissed (rather than having yet to be
				// displayed).
				shownNotices.push( editorNoticeKey( postID ) );
			}
		}
	};

	const unsubscribeFromListener = wp.data.subscribe( listener );
};

loadIdeaHubNotices();
