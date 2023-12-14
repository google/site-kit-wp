/**
 * Checkbox Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Checkbox from './Checkbox';

const defaultProps = {
	onChange: ( event ) => {
		global.console.log( 'onChange', event.target.value );
	},
	onKeyDown: ( event ) => {
		global.console.log( 'onKeyDown', event.target.value );
	},
};

function InteractiveCheckbox( { children, ...props } ) {
	const [ checked, setChecked ] = useState( false );
	return (
		<Checkbox
			checked={ checked }
			{ ...defaultProps }
			{ ...props }
			onChange={ ( event ) => {
				global.console.log( 'onChange', event.target.value );
				setChecked( event.target.checked );
			} }
		>
			{ children }
		</Checkbox>
	);
}

export function Checkboxes() {
	return (
		<div>
			<div>
				<Checkbox
					id="googlesitekit-checkbox-1"
					name="googlesitekit__checkbox"
					value="value-1"
					{ ...defaultProps }
				>
					Default Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					checked
					name="googlesitekit__checkbox"
					id="googlesitekit-checkbox-2"
					value="value-2"
					{ ...defaultProps }
				>
					Checked Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					disabled
					id="googlesitekit-checkbox-3"
					name="googlesitekit__checkbox"
					value="value-3"
					{ ...defaultProps }
				>
					Disabled Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					id="googlesitekit-checkbox-4"
					name="googlesitekit__checkbox"
					value="value-4"
					loading
					{ ...defaultProps }
				>
					Loading Checkbox
				</Checkbox>
			</div>

			<div>
				<Checkbox
					id="googlesitekit-checkbox-5"
					name="googlesitekit__checkbox"
					value="value-5"
					{ ...defaultProps }
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
				>
					Interactive Checkbox
				</InteractiveCheckbox>
			</div>

			<div>
				<Checkbox
					id="googlesitekit-checkbox-7"
					name="googlesitekit__checkbox"
					value="value-7"
					description="This is a checkbox with a description."
					{ ...defaultProps }
				>
					Checkbox with description
				</Checkbox>
			</div>
		</div>
	);
}

export default {
	title: 'Components/Material 3/Checkbox',
	component: Checkbox,
};
