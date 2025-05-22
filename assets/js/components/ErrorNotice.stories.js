/**
 * ErrorNotice Component Stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import ErrorNotice from './ErrorNotice';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';

function Template( args ) {
	return <ErrorNotice { ...args } />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {
	message: 'Foo error message',
};

export const WithNoPrefix = Template.bind( {} );
WithNoPrefix.storyName = 'No Prefix';
WithNoPrefix.args = {
	message: 'Foo error message',
	noPrefix: true,
};

export const WithReconnectURL = Template.bind( {} );
WithReconnectURL.storyName = 'With Reconnect URL';
WithReconnectURL.args = {
	storeName: MODULES_ANALYTICS_4,
	error: {
		type: 'error',
		message: 'Foo error message.',
		data: {
			reconnectURL: 'http://localhost:3000/',
		},
	},
};

export default {
	title: 'Components/ErrorNotice',
	component: ErrorNotice,
};
