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

/*
 * Internal dependencies
 */
import { VIEW_CONTEXT_DASHBOARD } from '../googlesitekit/constants';
import { CORE_MODULES } from '../googlesitekit/modules/datastore/constants';
import { MODULES_IDEA_HUB } from '../modules/idea-hub/datastore/constants';

const ideaHubModule = {
	slug: 'ideaHubModule',
	contexts: [ VIEW_CONTEXT_DASHBOARD ],
	// TODO: change this if launch version for the feature changes.
	version: '3.6.0',
	checkRequirements: async ( registry ) => {
		await registry.__experimentalResolveSelect( CORE_MODULES ).getModules();
		const isIdeaHubModuleActive = registry.select( CORE_MODULES ).isModuleActive( 'idea-hub' );
		const isIdeaHubModuleConnected = registry.select( CORE_MODULES ).isModuleConnected( 'idea-hub' );
		const hasNewIdeas = registry.select( MODULES_IDEA_HUB ).getNewIdeas();

		if ( ! isIdeaHubModuleActive || ! isIdeaHubModuleConnected || ! newIdeas.length ) {
			return false;
		}
		return true;
	},

};

export default ideaHubModule;
