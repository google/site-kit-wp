/**
 * OverlayCard Component Stories.
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
 * Internal dependencies
 */
import OverlayCard from '.';
import GraphicDesktop from '../../../svg/graphics/reader-revenue-manager-monetize-graphic-desktop.svg';
import GraphicMobile from '../../../svg/graphics/reader-revenue-manager-monetize-graphic-mobile.svg';
import ExternalIcon from '../../../svg/icons/external.svg';

function Template( args ) {
	return <OverlayCard { ...args } />;
}

export const DefaultOverlayCard = Template.bind( {} );
DefaultOverlayCard.storyName = 'Default';
DefaultOverlayCard.scenario = {};
DefaultOverlayCard.args = {
	title: 'See your top earning content',
	description:
		'Data is now available for the pages that earn the most revenue.',
	GraphicDesktop,
	GraphicMobile,
	ctaButton: {
		label: 'Show me',
		onClick: () => {},
	},
	dismissButton: {
		label: 'Maybe later',
		onClick: () => {},
	},
	visible: true,
};

export const OverlayCardWithExternalLink = Template.bind( {} );
OverlayCardWithExternalLink.storyName = 'With External Link';
OverlayCardWithExternalLink.scenario = {};
OverlayCardWithExternalLink.args = {
	title: 'Explore more features',
	description: 'Learn about all the features available in Google Site Kit.',
	GraphicDesktop,
	GraphicMobile,
	ctaButton: {
		href: 'https://example.com',
		label: 'Explore features',
		onClick: () => {},
		trailingIcon: <ExternalIcon width={ 13 } height={ 13 } />,
		target: '_blank',
	},
	dismissButton: {
		label: 'Maybe later',
		onClick: () => {},
	},
	visible: true,
};

export const OverlayCardWithoutGraphic = Template.bind( {} );
OverlayCardWithoutGraphic.storyName = 'Without Graphic';
OverlayCardWithoutGraphic.scenario = {};
OverlayCardWithoutGraphic.args = {
	title: 'Important notification',
	description:
		'This is an important notification that requires your attention.',
	ctaButton: {
		label: 'Take action',
		onClick: () => {},
	},
	dismissButton: {
		label: 'Dismiss',
		onClick: () => {},
	},
	visible: true,
};

export default {
	title: 'Components/OverlayCard',
	component: OverlayCard,
};
