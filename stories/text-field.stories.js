/**
 * TextField Component Stories.
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
import { TextField, Input } from '../assets/js/material-components';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

storiesOf( 'Global', module ).add( 'Text Fields', () => (
	<div>
		<div style={ { marginBottom: '50px' } }>
			<TextField
				label={ __( 'Text Field', 'google-site-kit' ) }
				name="textfield"
				floatingLabelClassName="mdc-floating-label--float-above"
				outlined
			>
				<Input value="https://www.sitekitbygoogle.com" />
			</TextField>
		</div>
		<div style={ { marginBottom: '50px' } }>
			<TextField
				label={ __( 'Disabled Text Field', 'google-site-kit' ) }
				name="textfield"
				floatingLabelClassName="mdc-floating-label--float-above"
				outlined
			>
				<Input value="https://www.sitekitbygoogle.com" disabled />
			</TextField>
		</div>
	</div>
) );
