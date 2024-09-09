/**
 * BadgeWithTooltip Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
 * Internal dependencies
 */
import BadgeWithTooltip from './BadgeWithTooltip';

function Template( args ) {
	return <BadgeWithTooltip { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

Default.args = {
	label: 'Title for badge with tooltip',
	tooltipTitle:
		'Still collecting full data for this timeframe, partial data is displayed for this group',
};
Default.scenario = {
	label: 'Modules/Analytics4/Components/BadgeWithTooltip/Default',
};

export default {
	title: 'Modules/Analytics4/Components/BadgeWithTooltip',
};
