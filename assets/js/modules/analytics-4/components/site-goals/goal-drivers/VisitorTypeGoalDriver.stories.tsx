/**
 * VisitorTypeGoalDriver component stories.
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
import type { ReactElement } from 'react';

/**
 * Internal dependencies
 */
import { useSelect, type Select } from 'googlesitekit-data';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import {
	provideModuleRegistrations,
	provideModules,
} from '../../../../../../../tests/js/utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Story } from '@/js/types/Story';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';
import type { GoalDriverComponentProps } from './types';

const RETRYABLE_REPORT_OPTIONS = {
	startDate: '2020-08-11',
	endDate: '2020-09-07',
	dimensions: [ 'newVsReturning' ],
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

interface VisitorTypeGoalDriverStoryProps extends GoalDriverComponentProps {
	setupRegistry?: (
		registry: Parameters< typeof provideModules >[ 0 ]
	) => Promise< void > | void;
	errorSelectorArgs?: Record< string, unknown >;
}

export default {
	title: 'Modules/Analytics4/Site Goals/GoalDrivers/VisitorType',
	component: VisitorTypeGoalDriver,
	decorators: [
		(
			StoryComponent: () => ReactElement,
			{ args }: { args: VisitorTypeGoalDriverStoryProps }
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

function Template( props: VisitorTypeGoalDriverStoryProps ) {
	const { errorSelectorArgs, error, ...args } = props;

	const storyError = useSelect(
		( select: Select ) => {
			if ( ! errorSelectorArgs ) {
				return error;
			}

			return select( MODULES_ANALYTICS_4 ).getErrorForSelector(
				'getReport',
				[ errorSelectorArgs ]
			);
		},
		[ error, errorSelectorArgs ]
	);

	return <VisitorTypeGoalDriver { ...args } error={ storyError } />;
}

export const Default = Template.bind(
	{}
) as Story< VisitorTypeGoalDriverStoryProps >;
Default.args = {
	goalType: 'lead',
	title: 'Leads by visitor type',
	rows: [
		{ label: 'Returning visitors', value: '60.5%' },
		{ label: 'New visitors', value: '39.5%' },
	],
	loading: false,
	limit: 3,
};
Default.scenario = {};

export const Loading = Template.bind(
	{}
) as Story< VisitorTypeGoalDriverStoryProps >;
Loading.args = {
	...Default.args,
	rows: [],
	loading: true,
};

export const NoData = Template.bind(
	{}
) as Story< VisitorTypeGoalDriverStoryProps >;
NoData.args = {
	...Default.args,
	rows: [],
	loading: false,
};

export const Error = Template.bind(
	{}
) as Story< VisitorTypeGoalDriverStoryProps >;
Error.args = {
	...Default.args,
	rows: [],
	loading: false,
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
			.receiveError( RETRYABLE_ERROR, 'getReport', [
				RETRYABLE_REPORT_OPTIONS,
			] );
	},
};
