/**
 * Idea Hub module tour for the posts list page.
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
import { __ } from '@wordpress/i18n';

/*
 * Internal dependencies
 */
import { VIEW_CONTEXT_POSTS_LIST } from '../googlesitekit/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { IDEA_HUB_GA_CATEGORY_POSTS } from '../modules/idea-hub/datastore/constants';

const ideaHubPostsTable = {
	slug: 'ideaHubPostsTable',
	contexts: [ VIEW_CONTEXT_POSTS_LIST ],
	version: '1.43.0',
	gaEventCategory: IDEA_HUB_GA_CATEGORY_POSTS,
	checkRequirements: async ( registry ) => {
		if ( ! document.querySelector( '.googlesitekit-idea-hub__post' ) ) {
			return false;
		}

		return registry
			.__experimentalResolveSelect( CORE_MODULES )
			.isModuleConnected( 'idea-hub' );
	},
	steps: [
		{
			target: '.googlesitekit-idea-hub__post',
			title: __(
				'Get started writing about your saved ideas',
				'google-site-kit'
			),
			content: __(
				'Drafts you created from Idea Hub within Site Kit appear here for easy access.',
				'google-site-kit'
			),
		},
	],
};

export default ideaHubPostsTable;
