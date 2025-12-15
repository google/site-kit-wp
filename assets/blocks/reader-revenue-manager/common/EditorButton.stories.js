/**
 * EditorButton component stories.
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
import EditorButton from './EditorButton';

function Template() {
	return (
		<div>
			<p>
				<span>Default</span>
				<EditorButton disabled={ false }>
					Subscribe with Google
				</EditorButton>
			</p>

			<p>
				<span>Disabled</span>
				<EditorButton disabled>Subscribe with Google</EditorButton>
			</p>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'EditorButton';
Default.scenario = {};

export default {
	title: 'Blocks/Reader Revenue Manager/EditorButton',
};
