/**
 * `core/feature-discovery` data store constants.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BadgeProps } from '@/js/components/Badge';
import { BADGE_VARIANTS } from '@/js/components/Badge/constants';
import {
	FeatureBadge,
	FeatureCategoryChipID,
	FeatureCategorySlug,
	FeatureEffort,
} from '@/js/googlesitekit/datastore/feature-discovery/types';

export const CORE_FEATURE_DISCOVERY = 'core/feature-discovery';

// The `core/ui` key holding the slugs of features that were set up without
// leaving the hub and are showing their success notice in place of their card.
// Session-only, as `core/ui` values are never persisted.
export const SUCCEEDED_FEATURES_UI_KEY = 'feature-discovery-succeeded-features';

export const FEATURE_CATEGORIES = {
	AUDIENCE: 'audience',
	ENGAGEMENT: 'engagement',
	MONETIZATION: 'monetization',
	TRAFFIC: 'traffic',
	PRIVACY: 'privacy',
	PERFORMANCE: 'performance',
	PRODUCTIVITY: 'productivity',
} as const;

export const FEATURE_CATEGORY_ANY = 'all-services';

// The curated order the categories are displayed in.
export const FEATURE_CATEGORY_ORDER = [
	FEATURE_CATEGORIES.AUDIENCE,
	FEATURE_CATEGORIES.ENGAGEMENT,
	FEATURE_CATEGORIES.MONETIZATION,
	FEATURE_CATEGORIES.TRAFFIC,
	FEATURE_CATEGORIES.PRIVACY,
	FEATURE_CATEGORIES.PERFORMANCE,
	FEATURE_CATEGORIES.PRODUCTIVITY,
] as const;

export const FEATURE_CATEGORY_TITLES: Record< FeatureCategorySlug, string > = {
	[ FEATURE_CATEGORIES.AUDIENCE ]: __(
		'Get to know your audience',
		'google-site-kit'
	),
	[ FEATURE_CATEGORIES.ENGAGEMENT ]: __(
		'Engage your visitors',
		'google-site-kit'
	),
	[ FEATURE_CATEGORIES.MONETIZATION ]: __(
		'Earn money from your content',
		'google-site-kit'
	),
	[ FEATURE_CATEGORIES.TRAFFIC ]: __(
		'Drive traffic to your site',
		'google-site-kit'
	),
	[ FEATURE_CATEGORIES.PRIVACY ]: __( 'Manage privacy', 'google-site-kit' ),
	[ FEATURE_CATEGORIES.PERFORMANCE ]: __(
		'Improve your site speed and experience',
		'google-site-kit'
	),
	[ FEATURE_CATEGORIES.PRODUCTIVITY ]: __(
		'Collaborate and save time',
		'google-site-kit'
	),
};

export const FEATURE_CATEGORY_CHIP_LABELS: Record<
	FeatureCategoryChipID,
	string
> = {
	[ FEATURE_CATEGORY_ANY ]: __( 'All services', 'google-site-kit' ),
	[ FEATURE_CATEGORIES.AUDIENCE ]: __(
		'Know your audience',
		'google-site-kit'
	),
	[ FEATURE_CATEGORIES.ENGAGEMENT ]: __(
		'Engage your visitors',
		'google-site-kit'
	),
	[ FEATURE_CATEGORIES.MONETIZATION ]: __( 'Monetize', 'google-site-kit' ),
	[ FEATURE_CATEGORIES.TRAFFIC ]: __( 'Drive traffic', 'google-site-kit' ),
	[ FEATURE_CATEGORIES.PRIVACY ]: __( 'Manage privacy', 'google-site-kit' ),
	[ FEATURE_CATEGORIES.PERFORMANCE ]: __(
		'Improve site speed',
		'google-site-kit'
	),
	[ FEATURE_CATEGORIES.PRODUCTIVITY ]: __( 'Collaborate', 'google-site-kit' ),
};

export const FEATURE_CATEGORY_CHIP_EVENT_LABELS: Record<
	FeatureCategoryChipID,
	string
> = {
	[ FEATURE_CATEGORY_ANY ]: 'all',
	[ FEATURE_CATEGORIES.AUDIENCE ]: 'know-your-audience',
	[ FEATURE_CATEGORIES.ENGAGEMENT ]: 'engage-your-visitors',
	[ FEATURE_CATEGORIES.MONETIZATION ]: 'monetize',
	[ FEATURE_CATEGORIES.TRAFFIC ]: 'drive-traffic',
	[ FEATURE_CATEGORIES.PRIVACY ]: 'manage-privacy',
	[ FEATURE_CATEGORIES.PERFORMANCE ]: 'improve-site-speed',
	[ FEATURE_CATEGORIES.PRODUCTIVITY ]: 'collaborate',
};

// Low is "Just a few clicks", medium "A short setup", high "In depth setup".
export const FEATURE_EFFORTS = {
	LOW: 1,
	MEDIUM: 2,
	HIGH: 3,
} as const;

export const FEATURE_EFFORT_LABELS: Record< FeatureEffort, string > = {
	[ FEATURE_EFFORTS.LOW ]: __( 'Just a few clicks', 'google-site-kit' ),
	[ FEATURE_EFFORTS.MEDIUM ]: __( 'Guided setup', 'google-site-kit' ),
	[ FEATURE_EFFORTS.HIGH ]: __( 'In depth setup', 'google-site-kit' ),
};

export const FEATURE_SETUP_TYPES = {
	SETUP_FLOW: 'setup-flow',
	BACKGROUND_TOGGLE: 'background-toggle',
	IN_PLACE_PANEL: 'in-place-panel',
} as const;

export const FEATURE_BADGES = {
	NEW: 'new',
	PAID_SERVICE: 'paid-service',
	RECOMMENDED: 'recommended',
} as const;

export const FEATURE_BADGE_PROPS: Record< FeatureBadge, BadgeProps > = {
	[ FEATURE_BADGES.NEW ]: {
		label: __( 'New', 'google-site-kit' ),
		variant: BADGE_VARIANTS.ANNOUNCEMENT,
	},
	[ FEATURE_BADGES.PAID_SERVICE ]: {
		label: __( 'Paid service', 'google-site-kit' ),
		variant: BADGE_VARIANTS.COST,
	},
	[ FEATURE_BADGES.RECOMMENDED ]: {
		label: __( 'Recommended for you', 'google-site-kit' ),
		variant: BADGE_VARIANTS.RECOMMENDATION,
	},
} as const;

export const FEATURE_RELEVANCY_REASONS = {
	JUST_HIDE: 'just_hide',
	NOT_RELEVANT: 'not_relevant',
	ALREADY_USING: 'already_using',
	TOO_COMPLICATED: 'too_complicated',
	SOMETHING_ELSE: 'something_else',
} as const;

// The namespace and keys used when sending Feature Discovery Hub relevancy
// feedback to the `core/user` `sendFeedback()` feedback endpoint.
export const FEATURE_HUB_FEEDBACK_NAMESPACE = 'feature_hub';

export const FEATURE_RELEVANCY_FEEDBACK_KEYS = {
	VOTE_REASON: 'vote_reason',
	DISMISS_REASON: 'dismiss_reason',
} as const;
