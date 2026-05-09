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
import { Story } from '@/js/types/Story';
import VisitorTypeGoalDriver from './VisitorTypeGoalDriver';
import type { GoalDriverComponentProps } from './types';

interface VisitorTypeGoalDriverStoryProps extends GoalDriverComponentProps {}

export default {
	title: 'Modules/Analytics4/Components/Site Goals/GoalDriverTiles/VisitorType',
	component: VisitorTypeGoalDriver,
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

function Template( props: VisitorTypeGoalDriverStoryProps ) {
	return <VisitorTypeGoalDriver { ...props } />;
}

export const Ready = Template.bind(
	{}
) as Story< VisitorTypeGoalDriverStoryProps >;
Ready.args = {
	goalType: 'lead',
	rows: [
		{ label: 'Returning visitors', value: '60.5%' },
		{ label: 'New visitors', value: '39.5%' },
	],
	limit: 3,
};
Ready.scenario = {};

export const NoData = Template.bind(
	{}
) as Story< VisitorTypeGoalDriverStoryProps >;
NoData.args = {
	...Ready.args,
	rows: [],
};
