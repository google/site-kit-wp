/**
 * ProductIDNotification Component Stories.
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
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import ProductIDNotification from './ProductIDNotification';

const NotificationWithComponentProps = withNotificationComponentProps(
	'rrm-product-id-notification'
)( ProductIDNotification );

function Template() {
	return <NotificationWithComponentProps />;
}

export const Contributions = Template.bind( {} );
Contributions.storyName = 'Contributions';
Contributions.args = {
	paymentOption: 'contributions',
};
Contributions.scenario = {};

export const Subscriptions = Template.bind( {} );
Subscriptions.storyName = 'Subscriptions';
Subscriptions.args = {
	paymentOption: 'subscriptions',
};
Subscriptions.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Components/Dashboard/ProductIDNotification',
	component: ProductIDNotification,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = async ( registry ) => {
				await registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						paymentOption: args.paymentOption,
						productIDs: [],
						productID: null, // TODO: Check what to do about the default value of 'openaccess'.
						publicationOnboardingState:
							PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE,
					} );
			};
			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
