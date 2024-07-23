/**
 * SubtleNotification Component Stories.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { Provider as ViewContextProvider } from '../../../components/Root/ViewContextContext';
import SubtleNotification from './SubtleNotification';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../googlesitekit/constants';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<SubtleNotification
				title={ __( 'Test Title', 'google-site-kit' ) }
				description={ __( 'Test Description', 'google-site-kit' ) }
				onDismiss={ () => {} }
				additionalCTA={
					<Button onClick={ () => {} }>
						{ __( 'Secondary', 'google-site-kit' ) }
					</Button>
				}
			/>
		</ViewContextProvider>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Components/SubtleNotification',
};

export default {
	title: 'Modules/Analytics4/Components/SubtleNotification',
	decorators: [
		( Story ) => {
			return <Story />;
		},
	],
};
