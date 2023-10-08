/**
 * Checkbox Component Stories.
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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import { Checkbox } from 'googlesitekit-components';

const InteractiveCheckbox = ( props ) => {
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
};

storiesOf( 'Global', module ).add(
	'Checkboxes',
	() => (
		<div>
			<div>
				<Checkbox
					id="googlesitekit-checkbox-1"
					name="googlesitekit__checkbox"
					onChange={ ( event ) => {
						global.console.log( event.target.value );
					} }
					value="value-1"
				>
					Default Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					checked
					name="googlesitekit__checkbox"
					id="googlesitekit-checkbox-2"
					onChange={ ( event ) => {
						global.console.log( event.target.value );
					} }
					value="value-2"
				>
					Checked Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					disabled
					id="googlesitekit-checkbox-3"
					name="googlesitekit__checkbox"
					onChange={ ( event ) => {
						global.console.log( event.target.value );
					} }
					value="value-3"
				>
					Disabled Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					id="googlesitekit-checkbox-4"
					name="googlesitekit__checkbox"
					loading
					onChange={ ( event ) => {
						global.console.log( event.target.value );
					} }
					value="value-4"
				>
					Loading Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					id="googlesitekit-checkbox-5"
					name="googlesitekit__checkbox"
					value="value-5"
					onChange={ ( event ) => {
						global.console.log( event.target.value );
					} }
				>
					<div>
						<span>
							Complex <span> Label</span>
						</span>
						<span>&nbsp;Checkbox</span>
					</div>
				</Checkbox>
			</div>

			<div>
				<InteractiveCheckbox
					id="googlesitekit-checkbox-6"
					name="googlesitekit__checkbox"
					value="value-6"
				/>
			</div>
		</div>
	),
	{
		options: {
			onReadyScript: 'mouse.js',
		},
	}
);
