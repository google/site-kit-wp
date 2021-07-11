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

const editorNoticeKey = ( postID ) => {
	return `modules::idea-hub::dismissed-editor-notice-${ postID }`;
};

const loadIdeaHubNotices = async ( _global = global ) => {
	const { wp } = _global;
	const shownNotices = [];

	const hasNotice = ( postID ) => {
		const notices = wp.data.select( 'core/notices' ).getNotices();

		if ( notices === undefined ) {
			return undefined;
		}

		const noticeKey = editorNoticeKey( postID );

		return notices.some( ( { id } ) => id === noticeKey );
	};

	const listener = async () => {
		// eslint-disable-next-line sitekit/acronym-case
		const postID = wp.data.select( 'core/editor' ).getCurrentPostId();

		if ( ! postID ) {
			return;
		}

		const noticeKey = editorNoticeKey( postID );

		const { cacheHit } = await getItem( noticeKey );

		// We've already shown this notice on a previous visit to this page in
		// the editor, so don't show it again.
		if ( cacheHit ) {
			unsubscribeFromListener();
			return;
		}

		// We've already shown this notice, so when it's hidden, mark it as shown
		// so it doesn't appear again.
		if ( hasNotice( postID ) === false && shownNotices.includes( noticeKey ) ) {
			// Don't show this notice for another 90 days.
			setItem( noticeKey, true, { ttl: 108000 } );
			unsubscribeFromListener();
			return;
		}

		// We haven't shown any notice for this post before, so let's check for
		// Idea Hub postmeta.
		const postMeta = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'meta' );

		// eslint-disable-next-line camelcase
		if ( postMeta?.googlesitekitpersistent_idea_text && ! shownNotices.includes( noticeKey ) ) {
			wp.data.dispatch( 'core/notices' ).createInfoNotice(
				sprintf(
					/* translators: %s: Idea post name */
					__( 'This post was created from an idea you picked in Site Kit’s Idea Hub: %s', 'google-site-kit' ),
					postMeta.googlesitekitpersistent_idea_text
				),
				{ id: noticeKey }
			);

			// Mark the notice as shown locally, so if it is no longer marked as
			// visible, we know it was dismissed.
			shownNotices.push( noticeKey );
		}
	};

	const unsubscribeFromListener = wp.data.subscribe( listener );
};

loadIdeaHubNotices();
