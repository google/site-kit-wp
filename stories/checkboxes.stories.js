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

import { useState } from '@wordpress/element';

/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import Checkbox from '../assets/js/components/Checkbox';

storiesOf( 'Global', module ).add(
	'Checkboxes',
	() => (
		<div>
			<div>
				<Checkbox
					id="googlesitekit-checkbox-1"
					name="googlesitekit__checkbox"
					onChange={ ( e ) => {
						global.console.log(
							'value, checked',
							e.target.value,
							e.target.checked
						);
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
					onChange={ ( e ) => {
						global.console.log(
							'value, checked',
							e.target.value,
							e.target.checked
						);
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
					onChange={ ( e ) => {
						global.console.log(
							'value, checked',
							e.target.value,
							e.target.checked
						);
					} }
					value="value-3"
				>
					Disabled Checkbox
				</Checkbox>
			</div>
		</div>
	),
	{
		options: {
			onReadyScript: 'mouse.js',
		},
	}
);

storiesOf( 'Global', module ).add( 'Interactive Checkbox', () => {
	const [ checked, setChecked ] = useState( false );
	return (
		<Checkbox
			id="googlesitekit-checkbox-4"
			name="googlesitekit__checkbox"
			onChange={ ( e ) => {
				global.console.log(
					'e.target, value, checked',
					e.target,
					e.target.value,
					e.target.checked
				);
				setChecked( e.target.checked );
			} }
			value="value-4"
			checked={ checked }
		>
			Interactive Checkbox
		</Checkbox>
	);
} );
