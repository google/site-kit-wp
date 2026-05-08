/**
 * MediaErrorHandler Component Stories.
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
import ErrorComponent from '../../../../tests/js/ThrowErrorComponent';
import MediaErrorHandler from './';

function Template( args ) {
	return (
		<MediaErrorHandler { ...args }>
			<ErrorComponent throwErrorOnMount />
		</MediaErrorHandler>
	);
}

function NoErrorsTemplate() {
	return (
		<MediaErrorHandler>
			<div>There are no errors here.</div>
		</MediaErrorHandler>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const WithCustomErrorMessage = Template.bind( {} );
WithCustomErrorMessage.storyName = 'With Custom Error Message';
WithCustomErrorMessage.args = {
	errorMessage: 'This is a custom error message 🐞',
};

export const NoErrors = NoErrorsTemplate.bind( {} );
NoErrors.storyName = 'No Errors';

export default {
	title: 'Components/MediaErrorHandler',
	component: MediaErrorHandler,
};
