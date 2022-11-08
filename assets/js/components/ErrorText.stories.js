/**
 * ErrorText stories.
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
 * Internal dependencies
 */

import ErrorText from './ErrorText';
import Link from './Link';

const Template = ( args ) => <ErrorText { ...args } />;

export const Default = Template.bind( {} );
Default.args = {
	message: 'This is error text.',
};

export const ReconnectURL = Template.bind( {} );
ReconnectURL.args = {
	message: 'This is error text.',
	reconnectURL: 'https://some.true.url',
};

export const WithChildren = Template.bind( {} );
WithChildren.args = {
	message: 'This is error text.',
	children: (
		<Link onClick={ () => global.console.log( 'Clicked' ) }>Link</Link>
	),
};

export default {
	title: 'Components/ErrorText',
	component: ErrorText,
};
