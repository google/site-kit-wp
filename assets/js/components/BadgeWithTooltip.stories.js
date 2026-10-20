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
import { BADGE_VARIANTS } from './Badge/constants';
import BadgeWithTooltip from './BadgeWithTooltip';

function Template( args ) {
	return <BadgeWithTooltip { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

Default.args = {
	label: 'Title for badge with tooltip',
	tooltipTitle:
		'This is an example of tooltip content for a badge with tooltip',
};
Default.scenario = {};

export const Announcement = Template.bind( {} );
Announcement.storyName = 'Announcement';
Announcement.args = {
	label: 'New',
	tooltipTitle: 'This feature is new',
	variant: BADGE_VARIANTS.ANNOUNCEMENT,
};

export const Recommendation = Template.bind( {} );
Recommendation.storyName = 'Recommendation';
Recommendation.args = {
	label: 'Recommended',
	tooltipTitle: 'Site Kit recommends this',
	variant: BADGE_VARIANTS.RECOMMENDATION,
};

export const Cost = Template.bind( {} );
Cost.storyName = 'Cost';
Cost.args = {
	label: 'Paid service',
	tooltipTitle: 'This service costs money to use',
	variant: BADGE_VARIANTS.COST,
};

export const Experimental = Template.bind( {} );
Experimental.storyName = 'Experimental';
Experimental.args = {
	label: 'Experimental',
	tooltipTitle: 'This feature is experimental',
	variant: BADGE_VARIANTS.EXPERIMENTAL,
};

export const Warning = Template.bind( {} );
Warning.storyName = 'Warning';
Warning.args = {
	label: 'Partial data',
	tooltipTitle: 'Data for this period is incomplete',
	variant: BADGE_VARIANTS.WARNING,
};

export function VRTStory() {
	const badgeStories = [
		Announcement,
		Recommendation,
		Cost,
		Experimental,
		Warning,
	];

	return (
		<div>
			{ badgeStories.map( ( BadgeStory, index ) => (
				<p key={ index }>
					<BadgeStory { ...BadgeStory.args } />
				</p>
			) ) }
		</div>
	);
}
VRTStory.storyName = 'All Badges With Tooltip VRT';
VRTStory.scenario = {};

export default {
	title: 'Components/BadgeWithTooltip',
};
