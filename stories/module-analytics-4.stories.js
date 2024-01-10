/**
 * Analytics-4 Stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import { MODULES_ANALYTICS } from '../assets/js/modules/analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../assets/js/modules/analytics-4/datastore/constants';
import { WithTestRegistry } from '../tests/js/utils';
import AccountSelect from '../assets/js/modules/analytics-4/components/common/AccountSelect';
import PropertySelect from '../assets/js/modules/analytics-4/components/common/PropertySelect';
import * as fixtures from '../assets/js/modules/analytics-4/datastore/__fixtures__';

function SetupWrap( { children } ) {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="googlesitekit-setup-module">{ children }</div>
			</section>
		</div>
	);
}

storiesOf( 'Analytics-4 Module', module ).add(
	'Account Property Select',
	() => {
		const setupRegistry = ( { dispatch } ) => {
			dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
			dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
			dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );

			dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries(
				fixtures.accountSummaries
			);
			dispatch( MODULES_ANALYTICS ).finishResolution(
				'getAccountSummaries',
				[]
			);
		};

		return (
			<WithTestRegistry callback={ setupRegistry }>
				<SetupWrap>
					<div className="googlesitekit-setup-module__inputs">
						<AccountSelect />
						<PropertySelect />
					</div>
				</SetupWrap>
			</WithTestRegistry>
		);
	}
);
