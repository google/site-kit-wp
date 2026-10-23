/**
 * Recent activity insight notice stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import classnames from 'classnames';
import fetchMock from 'fetch-mock';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { getFreshDataDateRange } from '@/js/modules/analytics-4/components/traffic-overview/hooks/useFreshDataDateRange';
import { provideInsightReport } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import { surveyTriggerEndpoint } from '@tests/js/mock-survey-endpoints';
import { provideSiteInfo, provideUserAuthentication } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import InsightNotice from './InsightNotice';
import {
	FRESH_DATA_FETCH_OPTIONS,
	getInsightReportArgs,
} from './reportOptions';

const REFERENCE_DATE = '2025-02-05';

/**
 * Sets the reference date, so every story shows the same days.
 *
 * @since n.e.x.t
 *
 * @param {Object} registry The registry to set up.
 * @return {void}
 */
function commonSetup( registry: WPDataRegistry ) {
	registry.dispatch( CORE_USER ).setReferenceDate( REFERENCE_DATE );
}

interface InsightNoticeStoryProps {
	/** Sets the registry state before the story renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
	/** Whether to pause the placeholder's pulse animation for the visual check. */
	pauseAnimation?: boolean;
}

function Template( {
	setupRegistry,
	pauseAnimation,
}: InsightNoticeStoryProps ) {
	// The notice's styles are scoped to the widget and the Recent activity
	// panel, so the story renders inside both. The placeholder's color comes
	// from its pulse animation, which the VRT build only keeps when paused.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div
				className={ classnames(
					'googlesitekit-widget--analyticsTrafficOverview',
					{ 'googlesitekit-vrt-animation-paused': pauseAnimation }
				) }
			>
				<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--recent-activity">
					<InsightNotice />
				</div>
			</div>
		</WithRegistrySetup>
	);
}

export const Typical = Template.bind( {} ) as Story< InsightNoticeStoryProps >;
Typical.storyName = 'Typical';
Typical.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );
	},
};
Typical.scenario = {};

// `Up` and `Down` run no visual check, because only their text is different
// from `Typical`.
export const Up = Template.bind( {} ) as Story< InsightNoticeStoryProps >;
Up.storyName = 'Up';
Up.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideInsightReport( registry, 132, [ 100, 100, 100, 100 ] );
	},
};

export const Down = Template.bind( {} ) as Story< InsightNoticeStoryProps >;
Down.storyName = 'Down';
Down.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideInsightReport( registry, 68, [ 100, 100, 100, 100 ] );
	},
};

export const Voted = Template.bind( {} ) as Story< InsightNoticeStoryProps >;
Voted.storyName = 'Voted';
Voted.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetSurveyTimeouts( [] );
		fetchMock.post(
			surveyTriggerEndpoint,
			{ body: {} },
			{ overwriteRoutes: true }
		);
		provideInsightReport( registry, 110, [ 100, 100, 100, 100 ] );
	},
};
Voted.parameters = {
	// Leaves room above the notice for the "Thanks for the feedback!" message.
	padding: '80px 24px 24px',
};
Voted.scenario = {
	viewport: 'large',
	clickSelector: '.googlesitekit-thumbs-survey-trigger__button--up',
	postInteractionWait: 200,
};

export const Loading = Template.bind( {} ) as Story< InsightNoticeStoryProps >;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [
				getInsightReportArgs( getFreshDataDateRange( REFERENCE_DATE ) ),
				FRESH_DATA_FETCH_OPTIONS,
			] );
	},
	pauseAnimation: true,
};
Loading.scenario = {};

/**
 * The site had no visitors four weeks ago, so the notice renders nothing.
 * This story runs no visual check, because the screenshot would be blank.
 */
export const Hidden = Template.bind( {} ) as Story< InsightNoticeStoryProps >;
Hidden.storyName = 'Hidden';
Hidden.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideInsightReport( registry, 110, [ 100, 100, 100 ] );
	},
};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/InsightNotice',
	component: InsightNotice,
};
