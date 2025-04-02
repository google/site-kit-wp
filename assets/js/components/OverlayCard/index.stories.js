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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import OverlayCard from '.';
import ReaderRevenueManagerIntroductoryGraphicDesktop from '../../../svg/graphics/reader-revenue-manager-monetize-graphic-desktop.svg';
import ReaderRevenueManagerIntroductoryGraphicMobile from '../../../svg/graphics/reader-revenue-manager-monetize-graphic-mobile.svg';

function Template( args ) {
	const { children, ...rest } = args;
	return <OverlayCard { ...rest }>{ children }</OverlayCard>;
}

export const DefaultOverlayCard = Template.bind( {} );
DefaultOverlayCard.scenario = {};
DefaultOverlayCard.args = {
	title: __( 'See your top earning content', 'google-site-kit' ),
	description: __(
		'Data is now available for the pages that earn the most revenue.',
		'google-site-kit'
	),
	GraphicDesktop: ReaderRevenueManagerIntroductoryGraphicDesktop,
	GraphicMobile: ReaderRevenueManagerIntroductoryGraphicMobile,
	primaryCTA: {
		label: __( 'Show me', 'google-site-kit' ),
		clickCallback: () => {},
	},
	tertiaryCTA: {
		label: __( 'Maybe later', 'google-site-kit' ),
		clickCallback: () => {},
	},
	visible: true,
};

export const OverlayCardWithExternalLink = Template.bind( {} );
OverlayCardWithExternalLink.scenario = {};
OverlayCardWithExternalLink.args = {
	title: __( 'Explore more features', 'google-site-kit' ),
	description: __(
		'Learn about all the features available in Google Site Kit.',
		'google-site-kit'
	),
	GraphicDesktop: ReaderRevenueManagerIntroductoryGraphicDesktop,
	GraphicMobile: ReaderRevenueManagerIntroductoryGraphicMobile,
	primaryCTA: {
		href: 'https://example.com',
		label: __( 'Explore features', 'google-site-kit' ),
		clickCallback: () => {},
		external: true,
	},
	tertiaryCTA: {
		label: __( 'Maybe later', 'google-site-kit' ),
		clickCallback: () => {},
	},
	visible: true,
};

export const OverlayCardWithoutGraphic = Template.bind( {} );
OverlayCardWithoutGraphic.scenario = {};
OverlayCardWithoutGraphic.args = {
	title: __( 'Important notification', 'google-site-kit' ),
	description: __(
		'This is an important notification that requires your attention.',
		'google-site-kit'
	),
	primaryCTA: {
		label: __( 'Take action', 'google-site-kit' ),
		clickCallback: () => {},
	},
	tertiaryCTA: {
		label: __( 'Dismiss', 'google-site-kit' ),
		clickCallback: () => {},
	},
	visible: true,
};

export const OverlayCardWithCustomContent = Template.bind( {} );
OverlayCardWithCustomContent.scenario = {};
OverlayCardWithCustomContent.args = {
	GraphicDesktop: ReaderRevenueManagerIntroductoryGraphicDesktop,
	GraphicMobile: ReaderRevenueManagerIntroductoryGraphicMobile,
	primaryCTA: {
		label: __( 'Continue', 'google-site-kit' ),
		clickCallback: () => {},
	},
	tertiaryCTA: {
		label: __( 'Cancel', 'google-site-kit' ),
		clickCallback: () => {},
	},
	visible: true,
	children: (
		<Fragment>
			<h3 className="googlesitekit-overlay-card__title">
				{ __( 'Custom Content Title', 'google-site-kit' ) }
			</h3>
			<p className="googlesitekit-overlay-card__description">
				{ __(
					'This overlay card uses custom content instead of title and description props.',
					'google-site-kit'
				) }
			</p>
			<p>
				{ __(
					'You can add any custom content here, including additional paragraphs, lists, or other elements.',
					'google-site-kit'
				) }
			</p>
		</Fragment>
	),
};

export default {
	title: 'Components/OverlayCard',
	component: OverlayCard,
};
