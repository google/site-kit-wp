/**
 * SubscribeActions stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	EMAIL_REPORT_FREQUENCIES,
} from '@/js/googlesitekit/datastore/user/constants';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SubscribeActions from './SubscribeActions';

interface SubscribeActionsStoryArgs {
	/** Whether the user is subscribed to email reports. */
	isSubscribed: boolean;
	/** The frequency the subscription already uses, one of `EMAIL_REPORT_FREQUENCIES`. */
	savedFrequency: string;
	/** The frequency picked on a frequency card, one of `EMAIL_REPORT_FREQUENCIES`. */
	selectedFrequency: string;
}

function Template( {
	isSubscribed,
	savedFrequency,
	selectedFrequency,
}: SubscribeActionsStoryArgs ) {
	function setupRegistry( registry: WPDataRegistry ) {
		registry.dispatch( CORE_SITE ).receiveGetEmailReportingSettings( {
			enabled: true,
		} );

		registry.dispatch( CORE_USER ).receiveGetEmailReportingSettings( {
			subscribed: isSubscribed,
			frequency: savedFrequency,
		} );

		registry
			.dispatch( CORE_USER )
			.setEmailReportingFrequency( selectedFrequency );
	}

	return (
		<WithRegistrySetup func={ setupRegistry }>
			{ /* The button row only gets its styles inside `UserSettingsSelectionPanel`,
			so this wrapper repeats that panel's class and width. */ }
			<div
				className="googlesitekit-user-settings-selection-panel"
				style={ { maxWidth: '530px' } }
			>
				<SubscribeActions
					isSubscribed={ isSubscribed }
					onSubscribe={ () => {} }
					onUnsubscribe={ () => {} }
					updateSettings={ () => {} }
				/>
			</div>
		</WithRegistrySetup>
	);
}

export const SubscribedFrequencyUnchanged = Template.bind(
	{}
) as Story< SubscribeActionsStoryArgs >;
SubscribedFrequencyUnchanged.storyName = 'Subscribed, frequency unchanged';
SubscribedFrequencyUnchanged.scenario = {};
SubscribedFrequencyUnchanged.args = {
	isSubscribed: true,
	savedFrequency: 'weekly',
	selectedFrequency: 'weekly',
};

export const SubscribedFrequencyChanged = Template.bind(
	{}
) as Story< SubscribeActionsStoryArgs >;
SubscribedFrequencyChanged.storyName = 'Subscribed, another frequency selected';
SubscribedFrequencyChanged.scenario = {};
SubscribedFrequencyChanged.args = {
	isSubscribed: true,
	savedFrequency: 'weekly',
	selectedFrequency: 'monthly',
};

export const NotSubscribed = Template.bind(
	{}
) as Story< SubscribeActionsStoryArgs >;
NotSubscribed.storyName = 'Not subscribed';
NotSubscribed.args = {
	isSubscribed: false,
	savedFrequency: 'weekly',
	selectedFrequency: 'weekly',
};

export default {
	title: 'Components/EmailReporting/SubscribeActions',
	component: SubscribeActions,
	argTypes: {
		savedFrequency: {
			control: { type: 'radio' },
			options: EMAIL_REPORT_FREQUENCIES,
		},
		selectedFrequency: {
			control: { type: 'radio' },
			options: EMAIL_REPORT_FREQUENCIES,
		},
	},
};
