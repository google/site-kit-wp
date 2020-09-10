/**
 * Analytics Settings form.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import Data from 'googlesitekit-data';
import {
	AccountSelect,
	AnonymizeIPSwitch,
	ExistingTagNotice,
	ProfileSelect,
	PropertySelect,
	TrackingExclusionSwitches,
	UseSnippetSwitch,
	ProfileNameTextField,
	ExistingGTMPropertyNotice,
	ExistingGTMPropertyError,
} from '../common';
import StoreErrorNotice from '../../../../components/StoreErrorNotice';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import { isValidPropertyID } from '../../util';
const { useSelect } = Data;

function SettingsForm() {
	const {
		gtmAnalyticsPropertyID,
		gtmAnalyticsPropertyIDPermission,
	} = useSelect( ( select ) => {
		const propertyID = select( MODULES_TAGMANAGER ).getSingleAnalyticsPropertyID();

		return {
			gtmAnalyticsPropertyID: propertyID,
			gtmAnalyticsPropertyIDPermission: select( STORE_NAME ).hasTagPermission( propertyID ),
		};
	} );

	global.console.log( gtmAnalyticsPropertyID, gtmAnalyticsPropertyIDPermission );

	let gtmTagNotice;
	if ( isValidPropertyID( gtmAnalyticsPropertyID ) && gtmAnalyticsPropertyIDPermission ) {
		gtmTagNotice = <ExistingGTMPropertyNotice />;
	} else if ( isValidPropertyID( gtmAnalyticsPropertyID ) && gtmAnalyticsPropertyIDPermission === false ) {
		gtmTagNotice = <ExistingGTMPropertyError />;
	}

	return (
		<div className="googlesitekit-analytics-settings-fields">
			<StoreErrorNotice moduleSlug="analytics" storeName={ STORE_NAME } />
			<ExistingTagNotice />
			{ gtmTagNotice }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<PropertySelect />

				<ProfileSelect />
			</div>

			<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
				<ProfileNameTextField />

				<UseSnippetSwitch />

				<AnonymizeIPSwitch />

				<TrackingExclusionSwitches />
			</div>
		</div>
	);
}

export default SettingsForm;
