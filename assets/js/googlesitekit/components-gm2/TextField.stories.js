/**
 * TextField Component Stories.
 *
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
import TextField from './TextField';
import WarningIcon from '../../../svg/icons/warning-v2.svg';

function Template() {
	return (
		<div>
			<div>
				<div style={ { marginBottom: '50px' } }>
					<TextField label="Text Field" name="textfield" outlined />
				</div>

				<div style={ { marginBottom: '50px' } }>
					<TextField
						label="Text Field with Value"
						name="textfield"
						outlined
						value="https://www.sitekitbygoogle.com"
					/>
				</div>

				<div style={ { marginBottom: '50px' } }>
					<TextField
						label="Disabled Text Field"
						name="textfield"
						outlined
						value="https://www.sitekitbygoogle.com"
						disabled
					/>
				</div>

				<div style={ { marginBottom: '50px' } }>
					<TextField
						label="With Helper Text"
						name="textfield"
						outlined
						value="https://www.sitekitbygoogle.com"
						helperText="Helper Text"
						helperTextPersistent
					/>
				</div>

				<div style={ { marginBottom: '50px' } }>
					<TextField
						label="With Icon"
						name="textfield"
						outlined
						value="https://www.sitekitbygoogle.com"
						trailingIcon={
							<span className="googlesitekit-text-field-icon--error">
								<WarningIcon width={ 14 } height={ 12 } />
							</span>
						}
					/>
				</div>

				<div>
					<TextField
						label="Textarea"
						name="textfield"
						outlined
						textarea
						value="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec suscipit auctor dui, id faucibus nisl"
					/>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Text Fields';
Default.scenario = {};

export default {
	title: 'Components/Text Fields',
	component: TextField,
};
