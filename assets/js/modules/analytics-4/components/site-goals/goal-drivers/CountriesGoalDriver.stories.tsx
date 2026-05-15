/**
 * CountriesGoalDriver component stories.
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
import { Story } from '@/js/types/Story';
import CountriesGoalDriver from './CountriesGoalDriver';
import { GoalDriverComponentProps } from './types';

type CountriesGoalDriverStoryProps = GoalDriverComponentProps;

export default {
	title: 'Modules/Analytics4/Components/Site Goals/GoalDriverTiles/Countries',
	component: CountriesGoalDriver,
	decorators: [
		( StoryComponent: () => ReactElement ) => (
			<div className="googlesitekit-widget">
				<div className="googlesitekit-widget__body">
					<StoryComponent />
				</div>
			</div>
		),
	],
};

function Template( props: CountriesGoalDriverStoryProps ) {
	return <CountriesGoalDriver { ...props } />;
}

const RETRYABLE_ERROR = {
	code: 400,
	message: 'Data loading failed',
	data: {
		status: 400,
		reason: 'badRequest',
	},
};

export const Ready = Template.bind(
	{}
) as Story< CountriesGoalDriverStoryProps >;
Ready.args = {
	goalType: 'ecommerce',
	rows: [
		{ label: 'Germany', value: '30.5%' },
		{ label: 'France', value: '24.7%' },
		{ label: 'Poland', value: '16.2%' },
	],
	loading: false,
	limit: 3,
};
Ready.scenario = {};

export const Loading = Template.bind(
	{}
) as Story< CountriesGoalDriverStoryProps >;
Loading.args = {
	...Ready.args,
	rows: [],
	loading: true,
};

export const NoData = Template.bind(
	{}
) as Story< CountriesGoalDriverStoryProps >;
NoData.args = {
	...Ready.args,
	rows: [],
	loading: false,
};

export const Error = Template.bind(
	{}
) as Story< CountriesGoalDriverStoryProps >;
Error.args = {
	...Ready.args,
	rows: [],
	loading: false,
	error: RETRYABLE_ERROR,
};
