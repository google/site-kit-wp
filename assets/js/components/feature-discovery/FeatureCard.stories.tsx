/**
 * FeatureCard stories.
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	actions as featureDiscoveryActions,
	controls as featureDiscoveryControls,
	initialState as featureDiscoveryInitialState,
	reducer as featureDiscoveryReducer,
	resolvers as featureDiscoveryResolvers,
	selectors as featureDiscoverySelectors,
} from '@/js/googlesitekit/datastore/feature-discovery';
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_BADGES,
	FEATURE_EFFORTS,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { FeatureSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { Story } from '@/js/types/Story';
import {
	provideFeatures,
	provideModuleRegistrations,
	provideModules,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureCard, { FeatureCardProps } from './FeatureCard';

interface StoryFeature extends Partial< FeatureSettings > {
	slug: string;
	cardProps?: Omit< FeatureCardProps, 'slug' >;
}

interface TemplateProps {
	features: StoryFeature[];
	modules?: { slug: string; name: string }[];
	newFeatureSlugs?: string[];
	unreadFeatureSlugs?: string[];
}

function provideFeatureNewness(
	registry: WPDataRegistry,
	newFeatureSlugs: string[],
	unreadFeatureSlugs: string[]
) {
	registry.registerStore( CORE_FEATURE_DISCOVERY, {
		actions: featureDiscoveryActions,
		controls: featureDiscoveryControls,
		initialState: featureDiscoveryInitialState,
		reducer: featureDiscoveryReducer,
		resolvers: featureDiscoveryResolvers,
		selectors: {
			...featureDiscoverySelectors,
			isFeatureNew: ( _state: unknown, slug: string ) =>
				newFeatureSlugs.includes( slug ),
			isFeatureUnread: ( _state: unknown, slug: string ) =>
				unreadFeatureSlugs.includes( slug ),
		},
	} );
}

function Template( {
	features,
	modules = [],
	newFeatureSlugs = [],
	unreadFeatureSlugs = [],
}: TemplateProps ) {
	return (
		<WithRegistrySetup
			func={ ( registry: WPDataRegistry ) => {
				const catalogFeatures = features.map( ( feature ) => {
					const catalogFeature = { ...feature };
					delete catalogFeature.cardProps;

					return catalogFeature;
				} );

				provideFeatureNewness(
					registry,
					newFeatureSlugs,
					unreadFeatureSlugs
				);
				provideModules( registry, modules );
				provideModuleRegistrations( registry );
				provideFeatures( registry, catalogFeatures );
			} }
		>
			<div className="googlesitekit-feature-card-story">
				{ features.map( ( { slug, cardProps = {} } ) => (
					<FeatureCard key={ slug } slug={ slug } { ...cardProps } />
				) ) }
			</div>
		</WithRegistrySetup>
	);
}

export const GoogleServiceFeature = Template.bind(
	{}
) as Story< TemplateProps >;
GoogleServiceFeature.storyName = 'Google service feature';
GoogleServiceFeature.args = {
	features: [
		{
			slug: 'enhanced-measurement',
			title: 'Measure even more visitor interactions',
			shortDescription:
				'Automatically collect more kinds of interactions with your content.',
			effort: FEATURE_EFFORTS.MEDIUM,
			moduleSlug: MODULE_SLUG_ANALYTICS_4,
		},
	],
	modules: [ { slug: MODULE_SLUG_ANALYTICS_4, name: 'Analytics' } ],
};
GoogleServiceFeature.scenario = {};

export const SiteKitFeature = Template.bind( {} ) as Story< TemplateProps >;
SiteKitFeature.storyName = 'Site Kit feature';
SiteKitFeature.args = {
	features: [
		{
			slug: 'key-metrics',
			title: 'See the metrics that matter most',
			shortDescription:
				'Choose the metrics most relevant to your site goals and see them together.',
			effort: FEATURE_EFFORTS.LOW,
		},
	],
};
SiteKitFeature.scenario = {};

export const AllServicesAndFeatures = Template.bind(
	{}
) as Story< TemplateProps >;
AllServicesAndFeatures.storyName = 'All services and features';
AllServicesAndFeatures.args = {
	features: [
		{
			slug: 'new-feature',
			title: 'A newly available feature',
			cardProps: { hideUnreadDot: true },
		},
	],
	newFeatureSlugs: [ 'new-feature' ],
	unreadFeatureSlugs: [ 'new-feature' ],
};
AllServicesAndFeatures.scenario = {};

export const WhatsNew = Template.bind( {} ) as Story< TemplateProps >;
WhatsNew.storyName = "What's new";
WhatsNew.args = {
	features: [
		{
			slug: 'unread-feature',
			title: 'An unread feature',
			cardProps: {
				hideNewBadge: true,
				isDismissible: true,
			},
		},
	],
	newFeatureSlugs: [ 'unread-feature' ],
	unreadFeatureSlugs: [ 'unread-feature' ],
};
WhatsNew.scenario = {};

export const PaidService = Template.bind( {} ) as Story< TemplateProps >;
PaidService.storyName = 'Paid service badge';
PaidService.args = {
	features: [
		{
			slug: 'adsense',
			title: 'Earn money from your content',
			shortDescription:
				'Connect AdSense to understand how your content is earning.',
			badges: [ FEATURE_BADGES.PAID_SERVICE ],
			moduleSlug: MODULE_SLUG_ADSENSE,
		},
	],
	modules: [ { slug: MODULE_SLUG_ADSENSE, name: 'AdSense' } ],
};
PaidService.scenario = {};

export const SeveralCards = Template.bind( {} ) as Story< TemplateProps >;
SeveralCards.storyName = 'Several cards';
SeveralCards.args = {
	features: [
		{
			slug: 'analytics',
			title: 'Understand how visitors use your site',
			moduleSlug: MODULE_SLUG_ANALYTICS_4,
		},
		{
			slug: 'key-metrics',
			title: 'See the metrics that matter most',
			effort: FEATURE_EFFORTS.MEDIUM,
		},
		{
			slug: 'adsense',
			title: 'Earn money from your content',
			badges: [ FEATURE_BADGES.PAID_SERVICE ],
			moduleSlug: MODULE_SLUG_ADSENSE,
		},
	],
	modules: [
		{ slug: MODULE_SLUG_ANALYTICS_4, name: 'Analytics' },
		{ slug: MODULE_SLUG_ADSENSE, name: 'AdSense' },
	],
};
SeveralCards.scenario = {};

export default {
	title: 'Components/Feature Discovery/FeatureCard',
	component: FeatureCard,
	parameters: { padding: 24 },
};
