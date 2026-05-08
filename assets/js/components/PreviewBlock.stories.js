/**
 * Preview Block Component Stories.
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
import PreviewBlock from './PreviewBlock';

function Template( args ) {
	return <PreviewBlock { ...args } />;
}

export const Rectangular = Template.bind( {} );
Rectangular.storyName = 'Rectangular';
Rectangular.args = {
	width: '100px',
	height: '100px',
};

export const Circular = Template.bind( {} );
Circular.storyName = 'Circular';
Circular.args = {
	width: '100px',
	height: '100px',
	shape: 'circular',
};

export const Responsive = Template.bind( {} );
Responsive.storyName = 'Responsive';
Responsive.args = {
	mobileWidth: '100px',
	mobileHeight: '100px',
	tabletWidth: '200px',
	tabletHeight: '200px',
	desktopWidth: '300px',
	desktopHeight: '300px',
	shape: 'circular',
};

export default {
	title: 'Components/PreviewBlock',
	component: PreviewBlock,
};
