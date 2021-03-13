/**
 * Button Component Stories.
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
 * Internal dependencies
 */
import Button from './Button';

export const DefaultButton = () =>
	<Button>Default Button</Button>;
DefaultButton.storyName = 'Default button';

export const DefaultButtonWithHover = () =>
	<Button className="googlesitekit-button--hover">VRT: Default Button Hover</Button>;
DefaultButtonWithHover.storyName = 'Default button with hover';
DefaultButtonWithHover.args = {
	options: {
		hoverSelector: '.googlesitekit-button--hover',
		postInteractionWait: 3000, // Wait for shadows to animate.
		onReadyScript: 'mouse.js',
	},
};

export const DefaultButtonWithLink = () =>
	<Button href="http://google.com">Default Button Link</Button>;
DefaultButtonWithLink.storyName = 'Default button with link';

export const DefaultButtonWithDanger = () =>
	<Button href="http://google.com" danger>Danger Button</Button>;
DefaultButtonWithDanger.storyName = 'Default button with danger attribute';

export const DefaultButtonWithDisabled = () =>
	<Button disabled>Disabled Button</Button>;
DefaultButtonWithDisabled.storyName = 'Default button with disabled attribute';

export default {
	title: 'Components/Button',
	component: Button,
};
