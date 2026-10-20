/**
 * AddFeaturesButton stories.
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	CORE_FEATURE_DISCOVERY,
	FEATURE_CATEGORIES,
	FEATURE_EFFORTS,
	FEATURE_SETUP_TYPES,
} from '@/js/googlesitekit/datastore/feature-discovery/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import AddFeaturesButton from './AddFeaturesButton';

function setupBaseRegistry( registry: WPDataRegistry ) {
	provideSiteInfo( registry );

	registry.dispatch( CORE_USER ).receiveInitialSiteKitVersion( '1.160.0' );
	registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	registry.dispatch( CORE_USER ).receiveGetExpirableItems( {} );
}

function registerNewFeature( registry: WPDataRegistry ) {
	registry
		.dispatch( CORE_FEATURE_DISCOVERY )
		.registerFeature( 'story-feature', {
			title: 'Story feature',
			shortDescription: 'A feature used in stories.',
			effort: FEATURE_EFFORTS.LOW,
			goalCategories: [ FEATURE_CATEGORIES.AUDIENCE ],
			addedInVersion: '1.160.0',
			setup: {
				type: FEATURE_SETUP_TYPES.BACKGROUND_TOGGLE,
				isEnabled: () => false,
			},
		} );
}

function Template() {
	return <AddFeaturesButton />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.parameters = {
	features: [ 'featureDiscoveryHub' ],
};

export const Hover = Template.bind( {} ) as Story;
Hover.storyName = 'Hover';
Hover.parameters = {
	features: [ 'featureDiscoveryHub' ],
	pseudo: { hover: true },
};

export const Focus = Template.bind( {} ) as Story;
Focus.storyName = 'Focus';
Focus.parameters = {
	features: [ 'featureDiscoveryHub' ],
	pseudo: { focus: true },
};

export const WithNewFeatures = Template.bind( {} ) as Story;
WithNewFeatures.storyName = 'With New Features';
WithNewFeatures.args = {
	setupRegistry: registerNewFeature,
};
WithNewFeatures.parameters = {
	features: [ 'featureDiscoveryHub' ],
};

// Renders the default, hover and focus states together to keep VRT reference
// images to a minimum. The new-features dot comes from registry state, which
// is shared by every button in a story, so the badged states need a story of
// their own rather than sitting alongside the unbadged ones.
function VRTTemplate() {
	const containerRef = useRef< HTMLDivElement >( null );

	// The pseudo-states addon's classes are applied directly rather than via
	// `parameters.pseudo`, which re-renders the Storybook preview and replaces
	// its registry, losing the state set up for the story.
	useEffect( () => {
		[ 'hover', 'focus' ].forEach( ( state ) => {
			containerRef.current
				?.querySelector(
					`.googlesitekit-vrt-add-features-button-${ state } .googlesitekit-add-features-button`
				)
				?.classList.add( `pseudo-${ state }` );
		} );
	}, [] );

	return (
		<div
			ref={ containerRef }
			style={ {
				alignItems: 'flex-start',
				display: 'flex',
				flexDirection: 'column',
				gap: '16px',
			} }
		>
			{ [ 'default', 'hover', 'focus' ].map( ( state ) => (
				<div
					key={ state }
					className={ `googlesitekit-vrt-add-features-button-${ state }` }
				>
					<AddFeaturesButton />
				</div>
			) ) }
		</div>
	);
}

export const VRTStory = VRTTemplate.bind( {} ) as Story;
VRTStory.storyName = 'All States VRT';
VRTStory.parameters = {
	features: [ 'featureDiscoveryHub' ],
};
VRTStory.scenario = {};

export const VRTWithNewFeaturesStory = VRTTemplate.bind( {} ) as Story;
VRTWithNewFeaturesStory.storyName = 'All States with New Features VRT';
VRTWithNewFeaturesStory.args = {
	setupRegistry: registerNewFeature,
};
VRTWithNewFeaturesStory.parameters = {
	features: [ 'featureDiscoveryHub' ],
};
VRTWithNewFeaturesStory.scenario = {};

export default {
	title: 'Components/FeatureDiscovery/AddFeaturesButton',
	component: AddFeaturesButton,
	decorators: [
		(
			StoryComponent: () => ReactElement,
			{ args }: { args: Story[ 'args' ] }
		) => {
			return (
				<WithRegistrySetup
					func={ ( registry: WPDataRegistry ) => {
						setupBaseRegistry( registry );

						args?.setupRegistry?.( registry );
					} }
				>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
};
