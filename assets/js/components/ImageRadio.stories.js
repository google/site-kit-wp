/**
 * Radio Component Stories.
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
import ImageRadio from './ImageRadio';

const image = (
	<svg
		width="241"
		height="175"
		viewBox="0 0 241 175"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<mask
			id="mask0_1205_5766"
			maskUnits="userSpaceOnUse"
			x="0"
			y="0"
			width="241"
			height="175"
		>
			<rect width="241" height="175" rx="5" fill="#D9D9D9" />
		</mask>
		<g mask="url(#mask0_1205_5766)">
			<rect opacity="0.5" width="241" height="65" fill="#EBEEF0" />
			<rect
				opacity="0.5"
				x="165"
				y="71"
				width="76"
				height="104"
				fill="#EBEEF0"
			/>
			<rect opacity="0.5" y="71" width="159" height="21" fill="#EBEEF0" />
			<rect opacity="0.5" y="98" width="159" height="21" fill="#EBEEF0" />
			<rect
				opacity="0.5"
				y="126"
				width="159"
				height="21"
				fill="#EBEEF0"
			/>
			<rect
				opacity="0.5"
				y="154"
				width="159"
				height="21"
				fill="#EBEEF0"
			/>
		</g>
	</svg>
);

function Template( args ) {
	return <ImageRadio { ...args }>{ args.label }</ImageRadio>;
}

export const UnChecked = Template.bind( {} );
UnChecked.args = {
	id: 'image-radio-story',
	name: 'image-radio-story',
	value: 'story',
	onChange: ( e ) => e,
	image,
	label: 'Image Radio',
	description: 'This is a description',
};

export const Checked = Template.bind( {} );
Checked.args = {
	id: 'image-radio-story',
	name: 'image-radio-story',
	value: 'story',
	onChange: ( e ) => e,
	image,
	label: 'Image Radio',
	description: 'This is a description',
	checked: true,
};

export const WithoutImage = Template.bind( {} );
WithoutImage.args = {
	id: 'image-radio-story',
	name: 'image-radio-story',
	value: 'story',
	onChange: ( e ) => e,
	label: 'Image Radio',
	description: 'This is a description',
};

export const CheckedWithoutImage = Template.bind( {} );
CheckedWithoutImage.args = {
	id: 'image-radio-story',
	name: 'image-radio-story',
	value: 'story',
	onChange: ( e ) => e,
	label: 'Image Radio',
	description: 'This is a description',
	checked: true,
};

export default {
	title: 'Components/Image Radio',
	component: ImageRadio,
};
