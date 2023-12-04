/**
 * SelectionBox Component Stories.
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
 * WordPress dependencies
 */
import { Fragment, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SelectionBox from './SelectionBox';

function Template() {
	const [ checked, setChecked ] = useState( false );

	return (
		<Fragment>
			<SelectionBox
				checked={ checked }
				id="selection-box-1"
				name="selection-box-1"
				onChange={ ( event ) => setChecked( event.target.checked ) }
				title="Default"
				value="1"
			>
				Default SelectionBox
			</SelectionBox>
			<SelectionBox
				checked={ false }
				disabled
				id="selection-box-2"
				name="selection-box-2"
				onChange={ () => {} }
				title="Disabled"
				value="1"
			>
				Disabled SelectionBox
			</SelectionBox>
		</Fragment>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'SelectionBox';
Default.scenario = {
	label: 'Global/SelectionBox',
};

export default {
	title: 'Components/SelectionBox',
	component: SelectionBox,
};
