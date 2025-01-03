/**
 * Checkbox Component Stories.
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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';
import NewBadge from '../../components/NewBadge';

function Template( args ) {
	const { label, ...rest } = args;
	return <Checkbox { ...rest }>{ label }</Checkbox>;
}

function InteractiveTemplate( props ) {
	const [ checked, setChecked ] = useState( false );
	return (
		<Checkbox
			{ ...props }
			onChange={ ( event ) => {
				global.console.log( event.target.value );
				setChecked( event.target.checked );
			} }
			checked={ checked }
		>
			Interactive Checkbox
		</Checkbox>
	);
}

export const Default = Template.bind( {} );
Default.args = {
	id: 'googlesitekit-checkbox-1',
	name: 'googlesitekit__checkbox',
	value: 'value-1',
	label: 'Default Checkbox',
};

export const Checked = Template.bind( {} );
Checked.args = {
	id: 'googlesitekit-checkbox-2',
	name: 'googlesitekit__checkbox-2',
	value: 'value-2',
	label: 'Checked Checkbox',
	checked: true,
};

export const Disabled = Template.bind( {} );
Disabled.args = {
	id: 'googlesitekit-checkbox-3',
	name: 'googlesitekit__checkbox-3',
	value: 'value-3',
	label: 'Disabled Checkbox',
	disabled: true,
};

export const Loading = Template.bind( {} );
Loading.args = {
	id: 'googlesitekit-checkbox-4',
	name: 'googlesitekit__checkbox-4',
	value: 'value-4',
	label: 'Loading Checkbox',
	loading: true,
};

export const ComplexLabel = Template.bind( {} );
ComplexLabel.args = {
	id: 'googlesitekit-checkbox-5',
	name: 'googlesitekit__checkbox-5',
	value: 'value-5',
	label: (
		<div>
			<span>
				Complex <span> Label</span>
			</span>
			<span>&nbsp;Checkbox</span>
		</div>
	),
};

export const Interactive = InteractiveTemplate.bind( {} );
Interactive.args = {
	id: 'googlesitekit-checkbox-6',
	name: 'googlesitekit__checkbox-6',
	value: 'value-6',
};

export const WithDescription = Template.bind( {} );
WithDescription.args = {
	id: 'googlesitekit-checkbox-7',
	name: 'googlesitekit__checkbox-7',
	value: 'value-7',
	label: 'Checkbox with description',
	description: 'This is a checkbox with a description.',
};

export const WithBadge = Template.bind( {} );
WithBadge.args = {
	id: 'googlesitekit-checkbox-8',
	name: 'googlesitekit__checkbox-8',
	value: 'value-8',
	label: 'Checkbox with badge',
	badge: <NewBadge />,
};

export function VRTStory() {
	return (
		<div>
			<div>
				<Default { ...Default.args } />
			</div>
			<div>
				<Checked { ...Checked.args } />
			</div>
			<div>
				<Disabled { ...Disabled.args } />
			</div>
			<div>
				{ /* The loading spinner uses a GIF rather than CSS animation therefore we can't
				     pause the animation for VRTs so we don't show this version of the checkbox
					 in the VRT. */ }
				{ /* <Loading { ...Loading.args } /> */ }
			</div>
			<div>
				<ComplexLabel { ...ComplexLabel.args } />
			</div>
			<div>
				<Interactive { ...Interactive.args } />
			</div>
			<div>
				<WithDescription { ...WithDescription.args } />
			</div>
			<div>
				<WithBadge { ...WithBadge.args } />
			</div>
		</div>
	);
}

VRTStory.storyName = 'All Checkboxes VRT';
VRTStory.scenario = {};

export default {
	title: 'Components/Material 2/Checkboxes',
	component: Checkbox,
};
