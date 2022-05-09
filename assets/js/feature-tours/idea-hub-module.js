/**
 * Idea Hub module Tour.
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
 * External dependencies
 */
import { EVENTS } from 'react-joyride';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/*
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_DASHBOARD,
	VIEW_CONTEXT_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { MODULES_IDEA_HUB } from '../modules/idea-hub/datastore/constants';

const ideaHubModule = {
	slug: 'ideaHubModule',
	contexts: [ VIEW_CONTEXT_DASHBOARD, VIEW_CONTEXT_DASHBOARD_VIEW_ONLY ],
	version: '1.43.0',
	checkRequirements: async ( registry ) => {
		await registry.resolveSelect( CORE_MODULES ).getModules();
		const isIdeaHubModuleActive = registry
			.select( CORE_MODULES )
			.isModuleActive( 'idea-hub' );
		const isIdeaHubModuleConnected = registry
			.select( CORE_MODULES )
			.isModuleConnected( 'idea-hub' );

		if ( ! isIdeaHubModuleActive || ! isIdeaHubModuleConnected ) {
			return false;
		}

		const newIdeas = await registry
			.resolveSelect( MODULES_IDEA_HUB )
			.getNewIdeas();

		return !! newIdeas.length;
	},
	steps: [
		{
			target: '.googlesitekit-widget--ideaHubIdeas',
			title: __(
				'Get inspiration for new topics to write about!',
				'google-site-kit'
			),
			content: __(
				'These ideas are based on unanswered searches related to the content of your site. They are organized by topics and will refresh every 2-3 days.',
				'google-site-kit'
			),
		},
		{
			target: '.googlesitekit-idea-hub__actions--create',
			title: __( 'Start a draft', 'google-site-kit' ),
			content: __(
				'Found an interesting idea you want to write about? Create a draft! You can always get back to it later on the Posts page.',
				'google-site-kit'
			),
		},
		{
			target: '.googlesitekit-idea-hub__idea--single',
			title: __( 'Save for later or dismiss', 'google-site-kit' ),
			content: __(
				'If you’re not ready to create a draft about an idea just yet, add it to your "Saved" list and revisit later. If you don’t like an idea, you can dismiss it from your list.',
				'google-site-kit'
			),
			placement: 'top',
		},
	],
	gaEventCategory: ( viewContext ) => `${ viewContext }_idea-hub-widget`,
	callback: ( data ) => {
		/*
		 * The third step of the feature tour involves the 'save' (pin) and
		 * 'dismiss' buttons, both of which are hidden unless you hover over
		 * them. As an enhancement, we will un-hide these buttons so they are
		 * visible during the final step of the tour by adding a CSS class,
		 * then remove the class once that step is finished.
		 */

		const { type, index } = data;
		if (
			! [ EVENTS.STEP_BEFORE, EVENTS.STEP_AFTER ].includes( type ) ||
			index !== 2
		) {
			return;
		}

		const unhideElementClass = 'googlesitekit-idea-hub__actions--unhide';

		const pinElement = global.document.querySelector(
			'.googlesitekit-idea-hub__actions--pin'
		);
		const dismissElement = global.document.querySelector(
			'.googlesitekit-idea-hub__actions--delete'
		);

		if ( ! pinElement || ! dismissElement ) {
			return;
		}

		if ( type === EVENTS.STEP_BEFORE ) {
			// Before final step, add the CSS class to the save / dismiss elements
			// to un-hide them.
			pinElement.classList.add( unhideElementClass );
			dismissElement.classList.add( unhideElementClass );
		}

		if ( type === EVENTS.STEP_AFTER ) {
			// After final step, remove the CSS class to the save / dismiss elements
			// to return them to normal.
			pinElement.classList.remove( unhideElementClass );
			dismissElement.classList.remove( unhideElementClass );
		}
	},
};

export default ideaHubModule;
