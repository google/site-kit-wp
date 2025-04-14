/**
 * Select stories.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, Select } from 'googlesitekit-components';

function Template( args ) {
	const { children, ...rest } = args;
	return <Select { ...rest }>{ children }</Select>;
}

export const Default = Template.bind( {} );
Default.args = {
	enhanced: true,
	name: 'select',
	label: __( 'Select', 'google-site-kit' ),
	outlined: true,
	options: [ 'Demo Option 1', 'Demo Option 2', 'Demo Option 3' ],
	value: 'Demo Option 1',
};

export const Disabled = Template.bind( {} );
Disabled.args = {
	enhanced: true,
	name: 'disabled',
	label: __( 'Disabled Select', 'google-site-kit' ),
	outlined: true,
	options: [ 'Demo Option 1', 'Demo Option 2', 'Demo Option 3' ],
	value: 'Demo Option 1',
	disabled: true,
};

export const Placeholder = Template.bind( {} );
Placeholder.args = {
	enhanced: true,
	name: 'select',
	label: __( 'Placeholder Select', 'google-site-kit' ),
	outlined: true,
	children: (
		<Fragment>
			<Option value="" disabled selected></Option>
			<Option value="Demo Option 1">Demo Option 1</Option>
			<Option value="Demo Option 2">Demo Option 2</Option>
			<Option value="Demo Option 3">Demo Option 3</Option>
		</Fragment>
	),
};

export const TimePeriod = Template.bind( {} );
TimePeriod.args = {
	enhanced: true,
	className: 'mdc-select--minimal',
	name: 'time_period',
	label: '',
	value: 'Last 28 days',
	options: [ 'Last 7 days', 'Last 28 days', 'Last 90 days' ],
};

export const OpenSelect = Template.bind( {} );
OpenSelect.args = {
	enhanced: true,
	outlined: true,
	className: 'googlesitekit-story-select-click',
	name: 'time_period',
	label: '',
	value: 'VRT: Open Select',
	options: [ 'Last 7 days', 'VRT: Open Select', 'Demo Option 3' ],
};

export const BasicSelect = Template.bind( {} );
BasicSelect.args = {
	name: 'select',
	label: __( 'Basic Select', 'google-site-kit' ),
	options: [ 'Demo Option 1', 'Demo Option 2', 'Demo Option 3' ],
	value: 'Demo Option 1',
	outlined: true,
};

export const WithHelperText = Template.bind( {} );
WithHelperText.args = {
	name: 'select',
	label: __( 'With helper text', 'google-site-kit' ),
	options: [ 'Demo Option 1', 'Demo Option 2', 'Demo Option 3' ],
	value: 'Demo Option 1',
	outlined: true,
	helperText: 'This is a helper text',
};

export function VRTStory() {
	return (
		<div>
			<div style={ { marginBottom: '50px' } }>
				<Default { ...Default.args } />
			</div>
			<div style={ { marginBottom: '50px' } }>
				<Disabled { ...Disabled.args } />
			</div>
			<div style={ { marginBottom: '50px' } }>
				<Placeholder { ...Placeholder.args } />
			</div>
			<div style={ { marginBottom: '50px' } }>
				<TimePeriod { ...TimePeriod.args } />
			</div>
			<div style={ { marginBottom: '50px' } }>
				<OpenSelect { ...OpenSelect.args } />
			</div>
			<div style={ { marginBottom: '50px' } }>
				<BasicSelect { ...BasicSelect.args } />
			</div>
			<div style={ { marginBottom: '250px' } }>
				<WithHelperText { ...WithHelperText.args } />
			</div>
		</div>
	);
}
VRTStory.storyName = 'All Selects VRT';
VRTStory.scenario = {
	// eslint-disable-next-line sitekit/no-storybook-scenario-label
	delay: 3000, // Sometimes the click doesn't work, waiting for everything to load.
	clickSelector: '.googlesitekit-story-select-click',
	postInteractionWait: 3000, // Wait for overlay and selects to animate.
	onReadyScript: 'mouse.js',
};

export default {
	title: 'Components/Select',
	component: Select,
};
