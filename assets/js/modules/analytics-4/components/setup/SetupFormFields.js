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
import {
	createInterpolateElement,
	Fragment,
	useCallback,
	useEffect,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
	WEBDATASTREAM_CREATE,
} from '@/js/modules/analytics-4/datastore/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import {
	AccountSelect,
	PropertySelect,
	WebDataStreamSelect,
	WebDataStreamNameInput,
} from '@/js/modules/analytics-4/components/common';
import SetupEnhancedMeasurementSwitch from './SetupEnhancedMeasurementSwitch';
import SetupUseSnippetSwitch from './SetupUseSnippetSwitch';
import StepHint from '@/js/components/setup/StepHint';
import Link from '@/js/components/Link';
import { useFeature } from '@/js/hooks/useFeature';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

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

	const propertyLearnMoreLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4-property' )
	);

	const webDataStreamLearnMoreLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4-data-stream' )
	);

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
					{ setupFlowRefreshEnabled && (
						<StepHint
							leadingText={ __(
								'What is an Analytics property?',
								'google-site-kit'
							) }
							tooltipText={ createInterpolateElement(
								__(
									'An Analytics property is a container for data collected from a website. It represents a specific website, and within a property, you can view reports, manage data collection, attribution, privacy settings, and product links. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											href={ propertyLearnMoreLink }
											external
											hideExternalIndicator
										/>
									),
								}
							) }
						/>
					) }
				</div>
				<div>
					<WebDataStreamSelect
						onChange={ resetEnhancedMeasurementSetting }
						hasModuleAccess
					/>
					{ setupFlowRefreshEnabled && (
						<StepHint
							leadingText={ __(
								'What is a web data stream?',
								'google-site-kit'
							) }
							tooltipText={ createInterpolateElement(
								__(
									'A data stream is a flow of data from your visitors to Analytics. When a data stream is created, Analytics generates a snippet of code that is added to your site to collect that data. <a>Learn more</a>',
									'google-site-kit'
								),
								{
									a: (
										<Link
											href={ webDataStreamLearnMoreLink }
											external
											hideExternalIndicator
										/>
									),
								}
							) }
						/>
					) }
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
