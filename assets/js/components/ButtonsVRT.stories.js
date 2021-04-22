/**
 * ButtonsVRT Story for VRT.
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
import { DefaultButton, LinkButton, DangerButton, DisabledButton, HoverButton } from './Button.stories';
DefaultButton.storyName = 'Default Button VRT';
HoverButton.storyName = 'Default Button Hover VRT';
LinkButton.storyName = 'Default Button Link VRT';
DangerButton.storyName = 'Danger Button VRT';
DisabledButton.storyName = 'Disabled Button';

export const ButtonsVRT = () => (
	<div>
		<p>
			<DefaultButton { ...DefaultButton.args } />
		</p>
		<p>
			<HoverButton { ...HoverButton.args } />
		</p>
		<p>
			<LinkButton { ...LinkButton.args } />
		</p>
		<p>
			<DangerButton { ...DangerButton.args } />
		</p>
		<p>
			<DisabledButton { ...DisabledButton.args } />
		</p>
	</div>
);

export default {
	title: 'Components/Buttons VRT',
};
