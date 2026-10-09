/**
 * Recent activity latest post performance stories.
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

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	createBreakdownReport,
	getLatestPostAnalyticsReportOptions,
	getLatestPostKeywordReportOptions,
	getLatestPostReportArgs,
	provideLatestPost,
	provideLatestPostAnalyticsReports,
	provideLatestPostKeywordReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { Story } from '@/js/types/Story';
import { provideModules, provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import LatestPostPerformance from './LatestPostPerformance';
import { getTopReferrerReportOptions } from './postReportOptions';

interface LatestPostPerformanceStoryProps {
	/** Sets the registry state the story needs before it renders. */
	setupRegistry: ( registry: WPDataRegistry ) => void;
	/** Pauses the preview blocks' animation, which VRT otherwise turns off, leaving the blocks blank. */
	pauseAnimation?: boolean;
}

/**
 * Connects Analytics and Search Console, sets a fixed reference date, and
 * stores the latest post, so every story starts from the same state.
 *
 * @since n.e.x.t
 *
 * @param {Object}        registry                 The registry to set up.
 * @param {Object}        [options]                Options.
 * @param {Array<string>} [options.detectedEvents] The conversion events that Site Goals detected. Defaults to `purchase`.
 * @return {void}
 */
function commonSetup(
	registry: WPDataRegistry,
	{ detectedEvents = [ 'purchase' ] }: { detectedEvents?: string[] } = {}
) {
	provideSiteInfo( registry );
	provideModules( registry, [
		{ slug: MODULE_SLUG_ANALYTICS_4, active: true, connected: true },
		{ slug: MODULE_SLUG_SEARCH_CONSOLE, active: true, connected: true },
	] );
	registry.dispatch( CORE_USER ).setReferenceDate( '2026-10-08' );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetSettings( { detectedEvents } );
	provideLatestPost( registry );
}

function Template( {
	setupRegistry,
	pauseAnimation = false,
}: LatestPostPerformanceStoryProps ) {
	// The section's styles are scoped to the widget and the panel, so the
	// story renders inside both.
	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div
				className={ classnames(
					'googlesitekit-widget--analyticsTrafficOverview',
					{ 'googlesitekit-vrt-animation-paused': pauseAnimation }
				) }
			>
				<div className="googlesitekit-traffic-overview__panel googlesitekit-traffic-overview__panel--recent-activity">
					<LatestPostPerformance />
				</div>
			</div>
		</WithRegistrySetup>
	);
}

export const Default = Template.bind(
	{}
) as Story< LatestPostPerformanceStoryProps >;
Default.storyName = 'Default';
Default.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideLatestPostAnalyticsReports( registry );
		provideLatestPostKeywordReport( registry );
	},
};
Default.scenario = {};

export const WithoutConversionEvent = Template.bind(
	{}
) as Story< LatestPostPerformanceStoryProps >;
WithoutConversionEvent.storyName = 'Without Conversion Event';
WithoutConversionEvent.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry, { detectedEvents: [] } );
		provideLatestPostAnalyticsReports( registry );
		provideLatestPostKeywordReport( registry );
	},
};
WithoutConversionEvent.scenario = {};

export const Loading = Template.bind(
	{}
) as Story< LatestPostPerformanceStoryProps >;
Loading.storyName = 'Loading';
Loading.args = {
	pauseAnimation: true,
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );

		getLatestPostAnalyticsReportOptions( registry ).forEach( ( options ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ options ] )
		);
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.startResolution( 'getReport', [
				getLatestPostKeywordReportOptions( registry ),
			] );
	},
};
Loading.scenario = {};

/** The other rows keep their figures beside the failed Search Console row. */
export const KeywordError = Template.bind(
	{}
) as Story< LatestPostPerformanceStoryProps >;
KeywordError.storyName = 'Top Keyword Error';
KeywordError.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideLatestPostAnalyticsReports( registry );

		const options = getLatestPostKeywordReportOptions( registry );

		registry.dispatch( MODULES_SEARCH_CONSOLE ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'Test error message.',
				data: {},
			},
			'getReport',
			[ options ]
		);
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.finishResolution( 'getReport', [ options ] );
	},
};
KeywordError.scenario = {};

/** Values too long for their row are cut off rather than overlapping the label. */
export const LongValues = Template.bind(
	{}
) as Story< LatestPostPerformanceStoryProps >;
LongValues.storyName = 'Long Values';
LongValues.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		commonSetup( registry );
		provideLatestPostAnalyticsReports( registry );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				createBreakdownReport( [
					[
						'some-really-long-referring-subdomain.example-newsletter.com',
						23,
					],
				] ),
				{
					options: getTopReferrerReportOptions(
						getLatestPostReportArgs( registry )
					),
				}
			);

		const keywordOptions = getLatestPostKeywordReportOptions( registry );

		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
			[
				{
					keys: [
						'is ice cream actually good for your health or not',
					],
					clicks: 12,
				},
			],
			{ options: keywordOptions }
		);
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.finishResolution( 'getReport', [ keywordOptions ] );
	},
};
LongValues.scenario = {};

export default {
	title: 'Modules/Analytics4/Components/Traffic Overview/LatestPostPerformance',
	component: LatestPostPerformance,
};
