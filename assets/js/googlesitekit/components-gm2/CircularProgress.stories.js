/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import CircularProgress from './CircularProgress';

const Template = ( args ) => <CircularProgress { ...args } />;

export const ColorPrimary = Template.bind( {} );
ColorPrimary.storyName = 'Color - Primary';

export const ColorSecondary = Template.bind( {} );
ColorSecondary.storyName = 'Color - Secondary';
ColorSecondary.args = {
	color: 'secondary',
};

export const SizeBig = Template.bind( {} );
SizeBig.storyName = 'Size - Big';
SizeBig.args = {
	size: 40,
};

export const SizeMedium = Template.bind( {} );
SizeMedium.storyName = 'Size - Medium';
SizeMedium.args = {
	size: 24,
};

export const SizeSmall = Template.bind( {} );
SizeSmall.storyName = 'Size - Small';
SizeSmall.args = {
	size: 14,
};

export const VRTStory = () => (
	<div>
		<h3>Colors</h3>
		<div style={ { marginBottom: '50px' } }>
			<h5>Primary Color</h5>
			<CircularProgress color="primary" />
		</div>
		<div style={ { marginBottom: '50px' } }>
			<h5>Secondary Color</h5>
			<CircularProgress color="secondary" />
		</div>

		<h3>Sizes</h3>
		<div style={ { marginBottom: '50px' } }>
			<h5>Big (40px)</h5>
			<CircularProgress size={ 40 } />
		</div>
		<div style={ { marginBottom: '50px' } }>
			<h5>Medium (24px)</h5>
			<CircularProgress size={ 24 } />
		</div>
		<div>
			<h5>Small (14px)</h5>
			<CircularProgress size={ 14 } />
		</div>
	</div>
);

VRTStory.scenario = {
	label: 'Global/CircularProgress',
};

export default {
	title: 'Components/CircularProgress',
	component: CircularProgress,
};
