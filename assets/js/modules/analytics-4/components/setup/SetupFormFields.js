/**
 * SetupFormFields component.
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
import { Fragment, useCallback, useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { isValidAccountID } from '@/js/modules/analytics-4/utils/validation';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
	WEBDATASTREAM_CREATE,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	AccountSelect,
	PropertyHint,
	PropertySelect,
	WebDataStreamHint,
	WebDataStreamSelect,
	WebDataStreamNameInput,
} from '@/js/modules/analytics-4/components/common';
import SetupEnhancedMeasurementSwitch from './SetupEnhancedMeasurementSwitch';
import SetupUseSnippetSwitch from './SetupUseSnippetSwitch';
import { useFeature } from '@/js/hooks/useFeature';

export default function SetupFormFields() {
	const accounts =
		useSelect( ( select ) =>
			select( MODULES_ANALYTICS_4 ).getAccountSummaries()
		) || [];
	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasExistingTag()
	);
	const existingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getExistingTag()
	);
	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);
	const measurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);
	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS_4 );

	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );

	useEffect( () => {
		if ( hasExistingTag ) {
			setUseSnippet( existingTag !== measurementID );
		}
	}, [ setUseSnippet, hasExistingTag, existingTag, measurementID ] );

	const resetEnhancedMeasurementSetting = useCallback( () => {
		setValues( ENHANCED_MEASUREMENT_FORM, {
			[ ENHANCED_MEASUREMENT_ENABLED ]: true,
		} );
	}, [ setValues ] );

	return (
		<Fragment>
			{ !! accounts.length && (
				<p className="googlesitekit-setup-module__select_account">
					{ __(
						'Please select the account information below. You can change this later in your settings.',
						'google-site-kit'
					) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<div>
					<AccountSelect
						onChange={ resetEnhancedMeasurementSetting }
					/>
				</div>
				<div>
					<PropertySelect
						onChange={ resetEnhancedMeasurementSetting }
						hasModuleAccess
					/>
					{ setupFlowRefreshEnabled &&
						isValidAccountID( accountID ) && <PropertyHint /> }
				</div>
				<div>
					<WebDataStreamSelect
						onChange={ resetEnhancedMeasurementSetting }
						hasModuleAccess
					/>
					{ setupFlowRefreshEnabled &&
						isValidAccountID( accountID ) && <WebDataStreamHint /> }
				</div>
			</div>

			{ webDataStreamID === WEBDATASTREAM_CREATE && (
				<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
					<WebDataStreamNameInput />
				</div>
			) }

			{ hasExistingTag && <SetupUseSnippetSwitch /> }
			<SetupEnhancedMeasurementSwitch />
		</Fragment>
	);
}
