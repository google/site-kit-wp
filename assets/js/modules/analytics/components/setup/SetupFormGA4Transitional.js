/**
 * Analytics GA4Transitional Setup form.
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
import { useUnmount } from 'react-use';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { HIDE_GA4_PROPERTY_SELECT_TOOLTIP } from '../../constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import {
	MODULES_ANALYTICS,
	PROFILE_CREATE,
	PROPERTY_TYPE_UA,
	PROPERTY_TYPE_GA4,
	ACCOUNT_CREATE,
} from '../../datastore/constants';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import GA4PropertySelect from '../../../analytics-4/components/common/PropertySelect';
import {
	AccountSelect,
	ProfileSelect,
	PropertySelect,
	PropertySelectIncludingGA4,
	ProfileNameTextField,
	GA4PropertyNotice,
	ExistingGTMPropertyNotice,
} from '../common';
import SetupUseSnippetSwitchUA from './SetupUseSnippetSwitch';
import { SetupUseSnippetSwitch as SetupUseSnippetSwitchGA4 } from '../../../analytics-4/components/setup';
import JoyrideTooltip from '../../../../components/JoyrideTooltip';
import Button from '../../../../components/Button';
const { useSelect, useDispatch } = Data;

export default function SetupFormGA4Transitional() {
	const isAnalyticsConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics' )
	);

	const accounts =
		useSelect( ( select ) => select( MODULES_ANALYTICS ).getAccounts() ) ||
		[];
	const propertyType = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPrimaryPropertyType()
	);

	const hasExistingGA4Tag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasExistingTag()
	);

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const profileID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getProfileID()
	);

	const ga4PropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);

	const documentationURL = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4' )
	);

	const { setValue } = useDispatch( CORE_UI );
	const markTooltipAsDisplayed = () =>
		setValue( HIDE_GA4_PROPERTY_SELECT_TOOLTIP, true );

	const hideGA4Tooltip = useSelect( ( select ) =>
		select( CORE_UI ).getValue( HIDE_GA4_PROPERTY_SELECT_TOOLTIP )
	);

	useUnmount( markTooltipAsDisplayed );

	const primaryPropertyID =
		propertyType === PROPERTY_TYPE_UA ? propertyID : ga4PropertyID;
	const showAssociatedPropertyNotice =
		accountID && accountID !== ACCOUNT_CREATE && primaryPropertyID;

	const notice =
		propertyType === PROPERTY_TYPE_UA
			? __(
					'You need to connect the Google Analytics 4 property that’s associated with this Universal Analytics property.',
					'google-site-kit'
			  )
			: __(
					'You need to connect the Universal Analytics property that’s associated with this Google Analytics 4 property.',
					'google-site-kit'
			  );

	return (
		<Fragment>
			<StoreErrorNotices
				moduleSlug="analytics"
				storeName={ MODULES_ANALYTICS }
			/>
			<ExistingGTMPropertyNotice />

			{ !! accounts.length && (
				<p className="googlesitekit-margin-bottom-0">
					{ __(
						'Please select the account information below. You can change this later in your settings.',
						'google-site-kit'
					) }
				</p>
			) }

			<div className="googlesitekit-setup-module__inputs">
				<AccountSelect />

				<PropertySelectIncludingGA4 />

				{ propertyType === PROPERTY_TYPE_UA && <ProfileSelect /> }
			</div>

			{ profileID === PROFILE_CREATE &&
				propertyType === PROPERTY_TYPE_UA && (
					<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
						<ProfileNameTextField />
					</div>
				) }

			{ propertyType === PROPERTY_TYPE_UA && <SetupUseSnippetSwitchUA /> }
			{ propertyType === PROPERTY_TYPE_GA4 && hasExistingGA4Tag && (
				<SetupUseSnippetSwitchGA4 />
			) }

			{ showAssociatedPropertyNotice && (
				<GA4PropertyNotice notice={ notice }>
					{ propertyType === PROPERTY_TYPE_GA4 && (
						<Fragment>
							<div className="googlesitekit-setup-module__inputs">
								<PropertySelect />
								<ProfileSelect />
							</div>

							{ profileID === PROFILE_CREATE && (
								<div className="googlesitekit-setup-module__inputs googlesitekit-setup-module__inputs--multiline">
									<ProfileNameTextField />
								</div>
							) }

							<SetupUseSnippetSwitchUA />
						</Fragment>
					) }
					{ propertyType === PROPERTY_TYPE_UA && (
						<Fragment>
							<div className="googlesitekit-setup-module__inputs">
								<GA4PropertySelect
									className="googlesitekit-analytics-4__select-property"
									onChange={ markTooltipAsDisplayed }
								/>
								{ isAnalyticsConnected && ! hideGA4Tooltip && (
									<JoyrideTooltip
										className="googlesitekit-analytics-setup-callout"
										title={ __(
											'Set up a new GA4 property from here.',
											'google-site-kit'
										) }
										target=".googlesitekit-analytics-4__select-property"
										cta={
											<Button
												className="googlesitekit-tooltip-button"
												href={ documentationURL }
												target="_blank"
												text
											>
												{ __(
													'Learn more',
													'google-site-kit'
												) }
											</Button>
										}
										styles={ {
											options: {
												arrowColor: '#3367D6', // $c-mariner
												backgroundColor: '#3367D6', // $c-mariner
											},
										} }
									/>
								) }
							</div>

							{ hasExistingGA4Tag && (
								<SetupUseSnippetSwitchGA4 />
							) }
						</Fragment>
					) }
				</GA4PropertyNotice>
			) }
		</Fragment>
	);
}
