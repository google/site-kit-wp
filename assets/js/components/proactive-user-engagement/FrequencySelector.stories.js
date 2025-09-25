/**
 * FrequencySelector stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies.
 */
import FrequencySelector from './FrequencySelector';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { provideSiteInfo } from '../../../../tests/js/utils';
import {
	CORE_USER,
	EMAIL_REPORT_FREQUENCIES,
} from '@/js/googlesitekit/datastore/user/constants';

export default {
	title: 'Components/ProactiveUserEngagement/FrequencySelector',
	component: FrequencySelector,
	argTypes: {
		frequency: {
			control: { type: 'radio' },
			options: [ ...EMAIL_REPORT_FREQUENCIES ],
		},
		startOfWeek: {
			control: { type: 'number', min: 0, max: 6, step: 1 },
		},
	},
	args: {
		frequency: 'weekly',
		startOfWeek: 1, // Monday default
		savedFrequency: undefined,
	},
};

function Template( args ) {
	const { startOfWeek, frequency, savedFrequency } = args;

	function setupRegistry( registry ) {
		provideSiteInfo( registry, { startOfWeek } );

		if ( savedFrequency ) {
			registry
				.dispatch( CORE_USER )
				.receiveGetProactiveUserEngagementSettings( {
					frequency: savedFrequency,
				} );
		}

		registry
			.dispatch( CORE_USER )
			.setProactiveUserEngagementFrequency( frequency );
	}

	return (
		<WithRegistrySetup func={ setupRegistry }>
			<div style={ { maxWidth: 920 } }>
				<FrequencySelector />
			</div>
		</WithRegistrySetup>
	);
}

export const WeeklySelected = Template.bind( {} );
WeeklySelected.args = {
	frequency: 'weekly',
};

export const MonthlySelected = Template.bind( {} );
MonthlySelected.args = {
	frequency: 'monthly',
};

export const QuarterlySelected = Template.bind( {} );
QuarterlySelected.args = {
	frequency: 'quarterly',
};

export const WeeklySelectedSundayStartOfTheWeek = Template.bind( {} );
WeeklySelectedSundayStartOfTheWeek.args = {
	frequency: 'weekly',
	startOfWeek: 0, // Sunday
};
WeeklySelectedSundayStartOfTheWeek.scenario = {};

export const PreviouslySavedFrequency = Template.bind( {} );
PreviouslySavedFrequency.args = {
	frequency: 'weekly',
	savedFrequency: 'monthly',
};
PreviouslySavedFrequency.scenario = {};

export const PreviouslySavedFrequencySameAsCurrent = Template.bind( {} );
PreviouslySavedFrequencySameAsCurrent.args = {
	frequency: 'monthly',
	savedFrequency: 'monthly',
};
PreviouslySavedFrequencySameAsCurrent.scenario = {};
