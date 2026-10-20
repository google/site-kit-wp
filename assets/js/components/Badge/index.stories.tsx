/**
 * Badge Component Stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { FC } from 'react';

/**
 * Internal dependencies
 */
import { Story as StoryType } from '@/js/types/Story';
import { BADGE_VARIANTS } from './constants';
import Badge, { BadgeProps } from './index';

const DEFAULT_ARGS = {
	label: 'Default',
};

const ANNOUNCEMENT_ARGS = {
	label: 'New',
	variant: BADGE_VARIANTS.ANNOUNCEMENT,
};

const RECOMMENDATION_ARGS = {
	label: 'Recommended',
	variant: BADGE_VARIANTS.RECOMMENDATION,
};

const COST_ARGS = {
	label: 'Paid service',
	variant: BADGE_VARIANTS.COST,
};

const EXPERIMENTAL_ARGS = {
	label: 'Experimental',
	variant: BADGE_VARIANTS.EXPERIMENTAL,
};

const WARNING_ARGS = {
	label: 'Action needed',
	variant: BADGE_VARIANTS.WARNING,
};

function Template( args: BadgeProps ) {
	return <Badge { ...args } />;
}

export const DefaultBadge = Template.bind( {} ) as StoryType< BadgeProps >;
DefaultBadge.storyName = 'Default Badge';
DefaultBadge.args = DEFAULT_ARGS;

export const AnnouncementBadge = Template.bind( {} ) as StoryType< BadgeProps >;
AnnouncementBadge.storyName = 'Announcement Badge';
AnnouncementBadge.args = ANNOUNCEMENT_ARGS;

export const RecommendationBadge = Template.bind(
	{}
) as StoryType< BadgeProps >;
RecommendationBadge.storyName = 'Recommendation Badge';
RecommendationBadge.args = RECOMMENDATION_ARGS;

export const CostBadge = Template.bind( {} ) as StoryType< BadgeProps >;
CostBadge.storyName = 'Cost Badge';
CostBadge.args = COST_ARGS;

export const ExperimentalBadge = Template.bind( {} ) as StoryType< BadgeProps >;
ExperimentalBadge.storyName = 'Experimental Badge';
ExperimentalBadge.args = EXPERIMENTAL_ARGS;

export const WarningBadge = Template.bind( {} ) as StoryType< BadgeProps >;
WarningBadge.storyName = 'Warning Badge';
WarningBadge.args = WARNING_ARGS;

const VRT_BADGES: BadgeProps[] = [
	DEFAULT_ARGS,
	ANNOUNCEMENT_ARGS,
	RECOMMENDATION_ARGS,
	COST_ARGS,
	EXPERIMENTAL_ARGS,
	WARNING_ARGS,
];

const VRTTemplate: FC = () => (
	<div>
		{ VRT_BADGES.map( ( badgeProps, index ) => (
			<p key={ index }>
				<Badge { ...badgeProps } />
			</p>
		) ) }
	</div>
);

export const AllBadgesVRT = VRTTemplate.bind( {} ) as StoryType;
AllBadgesVRT.storyName = 'All Badges VRT';
AllBadgesVRT.scenario = {};

export default {
	title: 'Components/Badge',
	component: Badge,
};
