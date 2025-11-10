/**
 * Analytics Settings View component.
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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '@/js/modules/analytics-4/datastore/constants';
import OptionalSettingsView from './OptionalSettingsView';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import DisplaySetting, { BLANK_SPACE } from '@/js/components/DisplaySetting';
import EnhancedConversionsSettingsNotice from './EnhancedConversionsSettingsNotice';
import Link from '@/js/components/Link';
import VisuallyHidden from '@/js/components/VisuallyHidden';
import { escapeURI } from '@/js/util/escape-uri';
import { useFeature } from '@/js/hooks/useFeature';
import SettingsStatuses from '@/js/components/settings/SettingsStatuses';
import {
	isValidPropertyID,
	isValidWebDataStreamID,
} from '@/js/modules/analytics-4/utils/validation';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import Typography from '@/js/components/Typography';

export default function SettingsView() {
	const gtgEnabled = useFeature( 'googleTagGateway' );
	const gtagUserDataEnabled = useFeature( 'gtagUserData' );

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getAccountID()
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const measurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);
	const googleTagID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getGoogleTagID()
	);
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUseSnippet()
	);
	const editAccountSettingsURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getServiceURL( {
			path: escapeURI`/a${ accountID }p${ propertyID }/admin/account/settings`,
		} )
	);
	const editDataStreamSettingsURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getServiceEntityAccessURL()
	);

	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);

	const isEnhancedMeasurementStreamEnabled = useSelect( ( select ) => {
		if (
			! isValidPropertyID( propertyID ) ||
			! isValidWebDataStreamID( webDataStreamID )
		) {
			return null;
		}

		return select( MODULES_ANALYTICS_4 ).isEnhancedMeasurementStreamEnabled(
			propertyID,
			webDataStreamID
		);
	} );

	const isConversionTrackingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isConversionTrackingEnabled()
	);

	const isGTGEnabled = useSelect( ( select ) => {
		if ( ! gtgEnabled ) {
			return false;
		}

		const {
			isGoogleTagGatewayEnabled,
			isGTGHealthy,
			isScriptAccessEnabled,
		} = select( CORE_SITE );

		return (
			isGoogleTagGatewayEnabled() &&
			isGTGHealthy() &&
			isScriptAccessEnabled()
		);
	} );

	if ( ! propertyID || propertyID === PROPERTY_CREATE ) {
		return null;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<Typography
						as="h5"
						size="medium"
						type="label"
						className="googlesitekit-settings-module__meta-item-type"
					>
						{ __( 'Account', 'google-site-kit' ) }
					</Typography>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ accountID } />
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
					<p className="googlesitekit-settings-module__meta-item-data googlesitekit-settings-module__meta-item-data--tiny">
						<Link href={ editAccountSettingsURL } external>
							{ createInterpolateElement(
								__(
									'Edit <VisuallyHidden>account </VisuallyHidden>in Analytics',
									'google-site-kit'
								),
								{
									VisuallyHidden: <VisuallyHidden />,
								}
							) }
						</Link>
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<Typography
						as="h5"
						size="medium"
						type="label"
						className="googlesitekit-settings-module__meta-item-type"
					>
						{ __( 'Property', 'google-site-kit' ) }
					</Typography>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ propertyID } />
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<Typography
						as="h5"
						size="medium"
						type="label"
						className="googlesitekit-settings-module__meta-item-type"
					>
						{ createInterpolateElement(
							__(
								'<VisuallyHidden>Google Analytics</VisuallyHidden> Measurement ID',
								'google-site-kit'
							),
							{
								VisuallyHidden: <VisuallyHidden />,
							}
						) }
					</Typography>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ measurementID } />
					</p>
				</div>
				{ googleTagID && (
					<div className="googlesitekit-settings-module__meta-item">
						<Typography
							as="h5"
							size="medium"
							type="label"
							className="googlesitekit-settings-module__meta-item-type"
						>
							{ __( 'Google Tag ID', 'google-site-kit' ) }
						</Typography>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ googleTagID } />
						</p>
					</div>
				) }
				<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
					<p className="googlesitekit-settings-module__meta-item-data googlesitekit-settings-module__meta-item-data--tiny">
						<Link href={ editDataStreamSettingsURL } external>
							{ createInterpolateElement(
								__(
									'Edit <VisuallyHidden>web data stream </VisuallyHidden>in Analytics',
									'google-site-kit'
								),
								{
									VisuallyHidden: <VisuallyHidden />,
								}
							) }
						</Link>
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<Typography
						as="h5"
						size="medium"
						type="label"
						className="googlesitekit-settings-module__meta-item-type"
					>
						{ __( 'Code Snippet', 'google-site-kit' ) }
					</Typography>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ useSnippet && (
							<span>
								{ __(
									'Snippet is inserted',
									'google-site-kit'
								) }
							</span>
						) }
						{ useSnippet === false && (
							<span>
								{ __(
									'Snippet is not inserted',
									'google-site-kit'
								) }
							</span>
						) }
						{ useSnippet === undefined && BLANK_SPACE }
					</p>
				</div>
			</div>

			<OptionalSettingsView />

			<SettingsStatuses
				statuses={ [
					{
						label: __( 'Enhanced Measurement', 'google-site-kit' ),
						status: isEnhancedMeasurementStreamEnabled,
					},
					{
						label: __(
							'Plugin conversion tracking',
							'google-site-kit'
						),
						status: isConversionTrackingEnabled,
					},
					...( gtgEnabled
						? [
								{
									label: __(
										'Google tag gateway for advertisers',
										'google-site-kit'
									),
									status: isGTGEnabled,
								},
						  ]
						: [] ),
				] }
			/>

			{ gtagUserDataEnabled && <EnhancedConversionsSettingsNotice /> }
		</div>
	);
}
