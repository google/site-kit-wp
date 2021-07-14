/**
 * Idea Hub module initialization.
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
import { STORE_NAME } from './datastore/constants';
import { registerStore as registerDataStore } from './datastore';
import { isFeatureEnabled } from '../../features';
import { AREA_DASHBOARD_ACQUISITION } from '../../googlesitekit/widgets/default-areas';

import DashboardIdeasWidget from './components/dashboard/DashboardIdeasWidget';
import IdeaHubIcon from '../../../svg/idea-hub.svg';
import { SettingsView } from './components/settings';

const ifIdeaHubIsEnabled = ( func ) => ( ...args ) => {
	if ( isFeatureEnabled( 'ideaHubModule' ) ) {
		func( ...args );
	}
};

export const registerStore = ifIdeaHubIsEnabled( registerDataStore );

export const registerModule = ifIdeaHubIsEnabled( ( modules ) => {
	modules.registerModule(
		'idea-hub',
		{
			storeName: STORE_NAME,
			SettingsViewComponent: SettingsView,
			Icon: IdeaHubIcon,
			features: [
				__( 'Suggestions for new topics to write about', 'google-site-kit' ),
			],
		}
	);
} );

export const registerWidgets = ifIdeaHubIsEnabled( ( widgets ) => {
	widgets.registerWidget(
		'ideaHubIdeas',
		{
			Component: DashboardIdeasWidget,
			width: widgets.WIDGET_WIDTHS.HALF,
			priority: 2,
			wrapWidget: false,
		},
		[
			AREA_DASHBOARD_ACQUISITION,
		],
	);
} );
