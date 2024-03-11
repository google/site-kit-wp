/**
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
 * Internal dependencies
 */
import SpinnerButton from './SpinnerButton';

function Template( args ) {
	return <SpinnerButton { ...args } />;
}

export const DefaultButton = Template.bind( {} );
DefaultButton.storyName = 'Default Button';
DefaultButton.args = {
	children: 'Default Button',
	onClick: () => new Promise( ( resolve ) => setTimeout( resolve, 5000 ) ),
};

export const ButtonWithSpinner = Template.bind( {} );
ButtonWithSpinner.storyName = 'Button with the Spinner';
ButtonWithSpinner.args = {
	children: 'Spinner Button',
	isSaving: true,
};

export const ButtonWithSpinnerOnLeft = Template.bind( {} );
ButtonWithSpinnerOnLeft.storyName = 'Button with the Spinner on the left';
ButtonWithSpinnerOnLeft.args = {
	children: 'Spinner Button',
	isSaving: true,
	spinnerOnLeft: true,
};

export default {
	title: 'Components/SpinnerButton',
	component: SpinnerButton,
};
