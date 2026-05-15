/**
 * TopTrafficChannelsGoalDriver component stories.
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
import { useSelect, Select } from 'googlesitekit-data';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import TopTrafficChannelsGoalDriver from './TopTrafficChannelsGoalDriver';
import { GoalDriverComponentProps } from './types';

const RETRYABLE_REPORT_OPTIONS = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'sessionDefaultChannelGroup' ],
	metrics: [ { name: 'eventCount' } ],
};

const RETRYABLE_ERROR = {
	code: 400,
	message: 'Data loading failed',
	data: {
		status: 400,
		reason: 'badRequest',
	},
};

interface TopTrafficChannelsGoalDriverStoryProps
	extends GoalDriverComponentProps {
	setupRegistry?: (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => Promise< void > | void;
	errorSelectorArgs?: Record< string, unknown >;
}

export default {
	title: 'Modules/Analytics4/Components/Site Goals/GoalDriverTiles/TopTrafficChannels',
	component: TopTrafficChannelsGoalDriver,
	decorators: [
		(
			StoryComponent: () => ReactElement,
			{ args }: { args: TopTrafficChannelsGoalDriverStoryProps }
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

function Template( {
	errorSelectorArgs,
	error,
	...args
}: TopTrafficChannelsGoalDriverStoryProps ) {
	const storyError = useSelect(
		( select: Select ) => {
			if ( ! errorSelectorArgs ) {
				return error;
			}

			return (
				select( MODULES_ANALYTICS_4 ).getErrorForSelector(
					'getReport',
					[ errorSelectorArgs ]
				) || error
			);
		},
		[ error, errorSelectorArgs ]
	);

	return <TopTrafficChannelsGoalDriver { ...args } error={ storyError } />;
}

export const Ready = Template.bind(
	{}
) as Story< TopTrafficChannelsGoalDriverStoryProps >;
Ready.args = {
	goalType: 'lead',
	rows: [
		{ label: 'Direct', value: '30.5%' },
		{ label: 'Organic search', value: '24.7%' },
		{ label: 'Organic social', value: '16.2%' },
	],
	loading: false,
	limit: 3,
};
Ready.scenario = {};

export const Loading = Template.bind(
	{}
) as Story< TopTrafficChannelsGoalDriverStoryProps >;
Loading.args = {
	...Ready.args,
	rows: [],
	loading: true,
};

export const NoData = Template.bind(
	{}
) as Story< TopTrafficChannelsGoalDriverStoryProps >;
NoData.args = {
	...Ready.args,
	rows: [],
	loading: false,
};

export const Error = Template.bind(
	{}
) as Story< TopTrafficChannelsGoalDriverStoryProps >;
Error.args = {
	...Ready.args,
	rows: [],
	loading: false,
	error: RETRYABLE_ERROR,
	errorSelectorArgs: RETRYABLE_REPORT_OPTIONS,
	setupRegistry: async (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideModuleRegistrations( registry );

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setErrorForSelector( RETRYABLE_ERROR, 'getReport', [
				RETRYABLE_REPORT_OPTIONS,
			] );

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ RETRYABLE_REPORT_OPTIONS ] );
	},
};
