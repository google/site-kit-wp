/**
 * `modules/idea-hub` data store constants.
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
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_POSTS_LIST,
	VIEW_CONTEXT_WP_DASHBOARD,
} from '../../../googlesitekit/constants';

export const MODULES_IDEA_HUB = 'modules/idea-hub';

export const IDEA_HUB_BUTTON_CREATE = 'IDEA_HUB_BUTTON_CREATE';
export const IDEA_HUB_BUTTON_VIEW = 'IDEA_HUB_BUTTON_VIEW';
export const IDEA_HUB_BUTTON_PIN = 'IDEA_HUB_BUTTON_PIN';
export const IDEA_HUB_BUTTON_UNPIN = 'IDEA_HUB_BUTTON_UNPIN';
export const IDEA_HUB_BUTTON_DELETE = 'IDEA_HUB_BUTTON_DELETE';

export const IDEA_HUB_IDEAS_PER_PAGE = 5;

export const IDEA_HUB_ACTIVITY_CREATING_DRAFT =
	'IDEA_HUB_ACTIVITY_CREATING_DRAFT';
export const IDEA_HUB_ACTIVITY_DRAFT_CREATED =
	'IDEA_HUB_ACTIVITY_DRAFT_CREATED';
export const IDEA_HUB_ACTIVITY_IS_DELETING = 'IDEA_HUB_ACTIVITY_IS_DELETING';
export const IDEA_HUB_ACTIVITY_DELETED = 'IDEA_HUB_ACTIVITY_DELETED';
export const IDEA_HUB_ACTIVITY_IS_PINNING = 'IDEA_HUB_ACTIVITY_IS_PINNING';
export const IDEA_HUB_ACTIVITY_PINNED = 'IDEA_HUB_ACTIVITY_PINNED';
export const IDEA_HUB_ACTIVITY_IS_UNPINNING = 'IDEA_HUB_ACTIVITY_IS_UNPINNING';
export const IDEA_HUB_ACTIVITY_UNPINNED = 'IDEA_HUB_ACTIVITY_UNPINNED';

export const IDEA_HUB_GA_CATEGORY_WPDASHBOARD = `${ VIEW_CONTEXT_WP_DASHBOARD }_idea-hub-saved-ideas-notification`;
export const IDEA_HUB_GA_CATEGORY_POSTS = `${ VIEW_CONTEXT_POSTS_LIST }_idea-hub`;

export const IDEA_HUB_TAB_NAMES_NEW = 'new-ideas';
export const IDEA_HUB_TAB_NAMES_SAVED = 'saved-ideas';
export const IDEA_HUB_TAB_NAMES_DRAFT = 'draft-ideas';
