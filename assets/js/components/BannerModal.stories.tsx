/**
 * BannerModal stories.
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
import { ComponentProps } from 'react';

/**
 * Internal dependencies
 */
import BannerModal from './BannerModal';
// @ts-expect-error - We need to add types for imported SVGs.
import WelcomeModalGraphic from '@/svg/graphics/welcome-modal-graphic.svg';

type BannerModalStoryProps = ComponentProps< typeof BannerModal >;

function Template( args: BannerModalStoryProps ) {
	return <BannerModal { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};
Default.args = {
	Graphic: WelcomeModalGraphic,
	onClose: () => {},
	title: 'Welcome to Site Kit',
	description:
		'Initial setup complete! Take a look at the special features Site Kit added to your dashboard based on your site goals.',
	ctaButton: {
		label: 'Start tour',
		onClick: () => {},
	},
	dismissButton: {
		label: 'Maybe later',
		onClick: () => {},
	},
};

export default {
	title: 'Components/BannerModal',
	component: BannerModal,
};
