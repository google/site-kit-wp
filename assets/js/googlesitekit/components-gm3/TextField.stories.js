/**
 * TextField Component Stories.
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

import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TextField from './TextField';

const Template = ( args ) => <TextField { ...args } />;

export const DefaultTextField = Template.bind( {} );
DefaultTextField.storyName = 'Default TextField';
DefaultTextField.args = {
	onChange: ( e ) => {
		global.console.log( '[story] change:', e.target.value );
	},
	value: 'value-1',
};

export const InteractiveTextField = () => {
	const [ value, setValue ] = useState( 'value-1' );
	return (
		<TextField
			onChange={ ( e ) => {
				global.console.log( '[story] change:', e.target.value );
				setValue( e.target.value );
			} }
			value={ value }
		/>
	);
};
InteractiveTextField.storyName = 'Interactive TextField';

export const ReadOnlyTextField = Template.bind( {} );
ReadOnlyTextField.storyName = 'Read Only TextField';
ReadOnlyTextField.args = {
	onChange: ( e ) => {
		global.console.log( '[story] change:', e.target.value );
	},
	value: 'value-1',
	readOnly: true,
};

export const DisabledTextField = Template.bind( {} );
DisabledTextField.storyName = 'Disabled TextField';
DisabledTextField.args = {
	onChange: ( e ) => {
		global.console.log( '[story] change:', e.target.value );
	},
	value: 'value-1',
	disabled: true,
};

export default {
	title: 'Components/Material 3/TextField',
	component: TextField,
};
