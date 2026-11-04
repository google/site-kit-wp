/**
 * FeatureSuccessNotice stories.
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
import { provideFeatures } from '@/js/googlesitekit/datastore/feature-discovery/test-utils';
import type { FeatureSuccessNotice as FeatureSuccessNoticeSettings } from '@/js/googlesitekit/datastore/feature-discovery/types';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import FeatureSuccessNotice from './FeatureSuccessNotice';

interface StoryArgs {
	successNotice: FeatureSuccessNoticeSettings;
}

function Template( { successNotice }: StoryArgs ) {
	function setupRegistry( registry: WPDataRegistry ) {
		provideFeatures( registry, [
			{
				slug: 'test-feature',
				successNotice,
			},
		] );
	}

	return (
		<WithRegistrySetup func={ setupRegistry }>
			<FeatureSuccessNotice slug="test-feature" onDismiss={ () => {} } />
		</WithRegistrySetup>
	);
}

export const WithCTA = Template.bind( {} ) as Story< StoryArgs >;
WithCTA.storyName = 'With CTA';
WithCTA.args = {
	successNotice: {
		title: 'Success! Your Newsletter sign-up form by Reader Revenue Manager is set up',
		description:
			'You can always update your sign-up form settings in Publisher center',
		cta: {
			label: 'Go to Publisher center',
			getURL: () => 'https://publishercenter.google.com/',
			external: true,
		},
	},
};

export const WithoutCTA = Template.bind( {} ) as Story< StoryArgs >;
WithoutCTA.storyName = 'Without CTA';
WithoutCTA.args = {
	successNotice: {
		title: 'Success! AdSense is set up',
		description: 'You are now monetizing your website with relevant ads',
	},
};

export const TitleOnly = Template.bind( {} ) as Story< StoryArgs >;
TitleOnly.storyName = 'Title only';
TitleOnly.args = {
	successNotice: {
		title: 'Success! PageSpeed Insights is set up',
	},
};

export default {
	title: 'Components/Feature Discovery/FeatureSuccessNotice',
	component: FeatureSuccessNotice,
};
