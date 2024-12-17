/**
 * ProgressBar Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { ProgressBar } from 'googlesitekit-components';

function Template( args ) {
	return <ProgressBar { ...args } />;
}

export const Default = Template.bind( {} );
Default.args = {};

export const Small = Template.bind( {} );
Small.args = {
	small: true,
};

export const SmallCompress = Template.bind( {} );
SmallCompress.args = {
	small: true,
	compress: true,
};

export function VRTStory() {
	return (
		<div>
			<div style={ { marginBottom: '50px' } }>
				<h2>Default</h2>
				<Default { ...Default.args } />
			</div>
			<div style={ { marginBottom: '50px' } }>
				<h2>Small</h2>
				<Small { ...Small.args } />
			</div>
			<div style={ { marginBottom: '50px' } }>
				<h2>Small Compress</h2>
				<SmallCompress { ...SmallCompress.args } />
			</div>
		</div>
	);
}

VRTStory.storyName = 'All Progress Bars VRT';
VRTStory.scenario = {};

export default {
	title: 'Components/ProgressBar',
};
