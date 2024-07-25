/**
 * Select stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Option, Select } from 'googlesitekit-components';

storiesOf( 'Global', module ).add(
	'Selects',
	() => {
		return (
			<div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						name="select"
						label={ __( 'Select', 'google-site-kit' ) }
						outlined
						options={ [
							'Demo Option 1',
							'Demo Option 2',
							'Demo Option 3',
						] }
						value="Demo Option 1"
					/>
				</div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						name="disabled"
						label={ __( 'Disabled Select', 'google-site-kit' ) }
						outlined
						options={ [
							'Demo Option 1',
							'Demo Option 2',
							'Demo Option 3',
						] }
						value="Demo Option 1"
						disabled
					/>
				</div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						name="select"
						label={ __( 'Placeholder Select', 'google-site-kit' ) }
						outlined
					>
						<Option value="" disabled selected></Option>
						<Option value="1">Demo Option 1 Here</Option>
						<Option value="2">Demo Option 2 Here</Option>
						<Option value="3">Demo Option 3 Here</Option>
					</Select>
				</div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						className="mdc-select--minimal"
						name="time_period"
						label=""
						value="Last 28 days"
						options={ [
							'Last 7 days',
							'Last 28 days',
							'Demo Option 3',
						] }
					/>
				</div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						enhanced
						outlined
						className="googlesitekit-story-select-click"
						name="time_period"
						label=""
						value="VRT: Open Select"
						options={ [
							'Last 7 days',
							'VRT: Open Select',
							'Demo Option 3',
						] }
					/>
				</div>
				<div style={ { marginBottom: '50px' } }>
					<Select
						name="select"
						label={ __( 'Basic Select', 'google-site-kit' ) }
						options={ [
							'Demo Option 1',
							'Demo Option 2',
							'Demo Option 3',
						] }
						value="Demo Option 1"
						outlined
					/>
				</div>
				<div style={ { marginBottom: '250px' } }>
					<Select
						className="mdc-select--wide"
						name="select"
						label={ __( 'Wide Select', 'google-site-kit' ) }
						options={ [
							'Demo Option 1',
							'Demo Option 2',
							'Demo Option 3',
						] }
						value="Demo Option 1"
						outlined
					/>
				</div>
			</div>
		);
	},
	{
		options: {
			delay: 3000, // Sometimes the click doesn't work, waiting for everything to load.
			clickSelector: '.googlesitekit-story-select-click',
			postInteractionWait: 3000, // Wait for overlay and selects to animate.
			onReadyScript: 'mouse.js',
		},
	}
);
