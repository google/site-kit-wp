/**
 * TopAuthorsGoalDriver component stories.
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
import { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	DATE_RANGE_OFFSET,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import {
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { GOAL_DRIVER_ROW_LIMIT_EXPANDED, GOAL_TYPES } from './constants';
import TopAuthorsGoalDriver from './TopAuthorsGoalDriver';
import { GoalDriverComponentProps } from './types';

interface TopAuthorsGoalDriverStoryProps extends GoalDriverComponentProps {
	setupRegistry?: (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => Promise< void > | void;
}

export default {
	title: 'Modules/Analytics4/Components/Site Goals/GoalDriverTiles/TopAuthors',
	component: TopAuthorsGoalDriver,
	decorators: [
		(
			StoryComponent: () => ReactElement,
			{ args }: { args: TopAuthorsGoalDriverStoryProps }
		) => {
			const wrappedStory = (
				<div className="googlesitekit-widget">
					<div className="googlesitekit-widget__body">
						<StoryComponent />
					</div>
				</div>
			);

			if ( ! args.setupRegistry ) {
				return wrappedStory;
			}

			return (
				<WithRegistrySetup func={ args.setupRegistry }>
					{ wrappedStory }
				</WithRegistrySetup>
			);
		},
	],
};

function setupAnalytics4(
	registry: Parameters< typeof provideModules >[ 0 ],
	availableCustomDimensions: string[] = [ 'googlesitekit_post_author' ]
) {
	provideUserAuthentication( registry );
	provideUserCapabilities( registry );
	provideModules( registry, [
		{
			slug: MODULE_SLUG_ANALYTICS_4,
			active: true,
			connected: true,
		},
	] );

	registry.dispatch( CORE_USER ).setReferenceDate( '2020-09-07' );
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( false );
	registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
		propertyID: '12345',
		availableCustomDimensions,
	} );

	if ( availableCustomDimensions.includes( 'googlesitekit_post_author' ) ) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsCustomDimensionGatheringData( {
				customDimension: 'googlesitekit_post_author',
				gatheringData: false,
			} );
	}
}

function getTopAuthorsReportOptions(
	registry: Parameters< typeof provideModules >[ 0 ],
	goalType = GOAL_TYPES.ECOMMERCE
) {
	const dates = registry.select( CORE_USER ).getDateRangeDates( {
		offsetDays: DATE_RANGE_OFFSET,
	} );
	const dimensionFilters = {
		eventName: {
			filterType: 'inListFilter',
			value: [ 'purchase' ],
		},
	};

	return {
		authorsReportOptions: {
			...dates,
			dimensions: [
				'customEvent:googlesitekit_post_author',
				'eventName',
			],
			dimensionFilters: {
				...dimensionFilters,
				'customEvent:googlesitekit_post_author': {
					filterType: 'emptyFilter',
					notExpression: true,
				},
			},
			metrics: [ { name: 'eventCount' } ],
			orderby: [
				{
					metric: { metricName: 'eventCount' },
					desc: true,
				},
			],
			limit: GOAL_DRIVER_ROW_LIMIT_EXPANDED,
			keepEmptyRows: false,
			reportID: `analytics-4_site-goals_top-authors_${ goalType }`,
		},
		totalReportOptions: {
			...dates,
			dimensionFilters,
			metrics: [ { name: 'eventCount' } ],
			reportID: `analytics-4_site-goals_top-authors-total_${ goalType }`,
		},
	};
}

function seedTopAuthorsReports(
	registry: Parameters< typeof provideModules >[ 0 ],
	{ loading = false } = {}
) {
	const { authorsReportOptions, totalReportOptions } =
		getTopAuthorsReportOptions( registry );

	if ( loading ) {
		[ authorsReportOptions, totalReportOptions ].forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ options ] );
		} );

		return;
	}

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: [
				{
					dimensionValues: [
						{ value: 'AuthorName1' },
						{ value: 'purchase' },
					],
					metricValues: [ { value: '305' } ],
				},
				{
					dimensionValues: [
						{ value: 'AuthorName2' },
						{ value: 'purchase' },
					],
					metricValues: [ { value: '247' } ],
				},
				{
					dimensionValues: [
						{ value: 'AuthorName3' },
						{ value: 'purchase' },
					],
					metricValues: [ { value: '162' } ],
				},
			],
		},
		{ options: authorsReportOptions }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ authorsReportOptions ] );

	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{
			rows: [ { metricValues: [ { value: '1000' } ] } ],
		},
		{ options: totalReportOptions }
	);
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getReport', [ totalReportOptions ] );
}

function Template( props: TopAuthorsGoalDriverStoryProps ) {
	return <TopAuthorsGoalDriver { ...props } />;
}

export const Ready = Template.bind(
	{}
) as Story< TopAuthorsGoalDriverStoryProps >;
Ready.args = {
	goalType: 'ecommerce',
	title: 'Top authors driving sales',
	primaryEvent: 'purchase',
	limit: 3,
	setupRegistry: ( registry ) => {
		setupAnalytics4( registry );
		seedTopAuthorsReports( registry );
	},
};
Ready.scenario = {};

export const Loading = Template.bind(
	{}
) as Story< TopAuthorsGoalDriverStoryProps >;
Loading.args = {
	...Ready.args,
	setupRegistry: ( registry ) => {
		setupAnalytics4( registry );
		seedTopAuthorsReports( registry, { loading: true } );
	},
};

export const MissingCustomDimensions = Template.bind(
	{}
) as Story< TopAuthorsGoalDriverStoryProps >;
MissingCustomDimensions.storyName = 'Missing custom dimensions';
MissingCustomDimensions.args = {
	goalType: 'ecommerce',
	title: 'Top authors driving sales',
	primaryEvent: 'purchase',
	limit: 3,
	setupRegistry: ( registry ) => {
		setupAnalytics4( registry, [] );
	},
};
