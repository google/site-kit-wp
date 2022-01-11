/**
 * DashboardIdeasWidget utils.
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

/**
 * Internal dependencies
 */
import {
	IDEA_HUB_BUTTON_CREATE,
	IDEA_HUB_BUTTON_PIN,
	IDEA_HUB_BUTTON_VIEW,
	IDEA_HUB_BUTTON_UNPIN,
	IDEA_HUB_BUTTON_DELETE,
	IDEA_HUB_ACTIVITY_CREATING_DRAFT,
	IDEA_HUB_ACTIVITY_IS_DELETING,
	IDEA_HUB_ACTIVITY_IS_PINNING,
	IDEA_HUB_ACTIVITY_IS_UNPINNING,
} from '../../../datastore/constants';
import PinIcon from '../../../../../../svg/icons/idea-hub-pin.svg';
import DeleteIcon from '../../../../../../svg/icons/idea-hub-delete.svg';
import CreateIcon from '../../../../../../svg/icons/idea-hub-create.svg';
import UnpinIcon from '../../../../../../svg/icons/idea-hub-unpin.svg';

const ACTIVITY_TIMER = 2000;

export const activityIconMap = {
	[ IDEA_HUB_BUTTON_DELETE ]: DeleteIcon,
	[ IDEA_HUB_BUTTON_PIN ]: PinIcon,
	[ IDEA_HUB_BUTTON_UNPIN ]: UnpinIcon,
	[ IDEA_HUB_BUTTON_CREATE ]: CreateIcon,
};

export const classNamesMap = {
	[ IDEA_HUB_BUTTON_DELETE ]: 'googlesitekit-idea-hub__actions--delete',
	[ IDEA_HUB_BUTTON_PIN ]: 'googlesitekit-idea-hub__actions--pin',
	[ IDEA_HUB_BUTTON_UNPIN ]: 'googlesitekit-idea-hub__actions--unpin',
	[ IDEA_HUB_BUTTON_CREATE ]: 'googlesitekit-idea-hub__actions--create',
	[ IDEA_HUB_BUTTON_VIEW ]: 'googlesitekit-idea-hub__actions--view',
};

export const titlesMap = {
	[ IDEA_HUB_BUTTON_DELETE ]: __( 'Dismiss', 'google-site-kit' ),
	[ IDEA_HUB_BUTTON_PIN ]: __( 'Save for later', 'google-site-kit' ),
	[ IDEA_HUB_BUTTON_UNPIN ]: __( 'Remove from saved', 'google-site-kit' ),
	[ IDEA_HUB_BUTTON_CREATE ]: __( 'Start a draft post', 'google-site-kit' ),
	[ IDEA_HUB_BUTTON_VIEW ]: __( 'View draft', 'google-site-kit' ),
};

export const progressMap = {
	[ IDEA_HUB_BUTTON_DELETE ]: IDEA_HUB_ACTIVITY_IS_DELETING,
	[ IDEA_HUB_BUTTON_PIN ]: IDEA_HUB_ACTIVITY_IS_PINNING,
	[ IDEA_HUB_BUTTON_UNPIN ]: IDEA_HUB_ACTIVITY_IS_UNPINNING,
	[ IDEA_HUB_BUTTON_CREATE ]: IDEA_HUB_ACTIVITY_CREATING_DRAFT,
};

export const noticesMap = {
	IDEA_HUB_ACTIVITY_DRAFT_CREATED: __( 'Draft created', 'google-site-kit' ),
	IDEA_HUB_ACTIVITY_PINNED: __( 'Idea saved', 'google-site-kit' ),
	IDEA_HUB_ACTIVITY_UNPINNED: __(
		'Idea removed from saved',
		'google-site-kit'
	),
	IDEA_HUB_ACTIVITY_DELETED: __( 'Idea dismissed', 'google-site-kit' ),
};

export const waitForActivity = () =>
	new Promise( ( resolve ) => {
		setTimeout( () => {
			resolve();
		}, ACTIVITY_TIMER );
	} );
