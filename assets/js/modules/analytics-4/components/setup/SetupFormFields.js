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
import Data from 'googlesitekit-data';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
	WEBDATASTREAM_CREATE,
} from '../../datastore/constants';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	AccountSelect,
	PropertySelect,
	WebDataStreamSelect,
	WebDataStreamNameInput,
} from '../common';
import SetupEnhancedMeasurementSwitch from './SetupEnhancedMeasurementSwitch';
import SetupUseSnippetSwitch from './SetupUseSnippetSwitch';
const { useSelect, useDispatch } = Data;

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
	const measurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);
	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);

	const { setValues } = useDispatch( CORE_FORMS );

	const { setUseSnippet } = useDispatch( MODULES_ANALYTICS_4 );

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
				<p className="googlesitekit-margin-bottom-0">
					{ __(
						'Please select the account information below. You can change this later in your settings.',
						'google-site-kit'
					) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect onChange={ resetEnhancedMeasurementSetting } />
				<PropertySelect onChange={ resetEnhancedMeasurementSetting } />
				<WebDataStreamSelect
					onChange={ resetEnhancedMeasurementSetting }
				/>
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
