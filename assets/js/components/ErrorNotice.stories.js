/**
 * ErrorNotice stories.
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
import { provideModules } from '../../../tests/js/utils';
import { MODULES_ANALYTICS } from '../modules/analytics/datastore/constants';
import WithRegistrySetup from '../../../tests/js/WithRegistrySetup';
import ErrorNotice from './ErrorNotice';

const notFoundError = {
	code: 404,
	message: 'Not found',
	data: {
		status: 404,
	},
};

const Template = ( { setupRegistry = () => {}, ...args } ) => (
	<WithRegistrySetup func={ setupRegistry }>
		<ErrorNotice { ...args } />
	</WithRegistrySetup>
);

export const Default = Template.bind( {} );
Default.args = {
	error: new Error( 'This is error text' ),
};

export const WithRetryLink = Template.bind( {} );
WithRetryLink.args = {
	error: notFoundError,
	storeName: MODULES_ANALYTICS,
	setupRegistry: ( registry ) => {
		provideModules( registry, [
			{
				active: true,
				connected: true,
				slug: 'analytics',
			},
		] );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveError( notFoundError, 'getReport', [] );
	},
};

export default {
	title: 'Components/ErrorNotice',
	component: ErrorNotice,
};
