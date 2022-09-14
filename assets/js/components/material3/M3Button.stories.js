/**
 * Button Component Stories.
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
 * Internal dependencies
 */
import M3Button from './M3Button';

const Template = ( args ) => <M3Button { ...args } />;

export const DefaultButton = Template.bind( {} );
DefaultButton.storyName = 'Default Button';
DefaultButton.args = {
	children: 'Default Button',
	//  href: '#',
};

export default {
	title: 'Components/Material3/M3Button',
	component: M3Button,
};
