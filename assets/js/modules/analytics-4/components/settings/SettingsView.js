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
import Data from 'googlesitekit-data';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../datastore/constants';
import { ProgressBar } from 'googlesitekit-components';
import OptionalSettingsView from './OptionalSettingsView';
import SettingsEnhancedMeasurementView from './SettingsEnhancedMeasurementView';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import DisplaySetting from '../../../../components/DisplaySetting';
import Link from '../../../../components/Link';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import { escapeURI } from '../../../../util/escape-uri';
import useMigrateAdsConversionID from '../../hooks/useMigrateAdsConversionID';
import { useFeature } from '../../../../hooks/useFeature';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

export default function SettingsView() {
	const iceEnabled = useFeature( 'conversionInfra' );

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

	const isMigratingAdsConversionID = useMigrateAdsConversionID();

	const isConversionTrackingEnabled = useSelect( ( select ) => {
		if ( ! iceEnabled ) {
			return false;
		}

		return select( CORE_SITE ).isConversionTrackingEnabled();
	} );

	if ( ! propertyID || propertyID === PROPERTY_CREATE ) {
		return null;
	}

	if ( isMigratingAdsConversionID ) {
		return <ProgressBar />;
	}

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<StoreErrorNotices
				moduleSlug="analytics-4"
				storeName={ MODULES_ANALYTICS_4 }
			/>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Account', 'google-site-kit' ) }
					</h5>
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
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Property', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ propertyID } />
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ createInterpolateElement(
							__(
								'<VisuallyHidden>Google Analytics</VisuallyHidden> Measurement ID',
								'google-site-kit'
							),
							{
								VisuallyHidden: <VisuallyHidden />,
							}
						) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ measurementID } />
					</p>
				</div>
				{ googleTagID && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Google Tag ID', 'google-site-kit' ) }
						</h5>
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
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Code Snippet', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ useSnippet && (
							<span>
								{ __(
									'Snippet is inserted',
									'google-site-kit'
								) }
							</span>
						) }
						{ ! useSnippet && (
							<span>
								{ __(
									'Snippet is not inserted',
									'google-site-kit'
								) }
							</span>
						) }
					</p>
				</div>
			</div>

			<SettingsEnhancedMeasurementView />

			<OptionalSettingsView />

			{ iceEnabled && (
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __(
							'Enhanced conversion tracking',
							'google-site-kit'
						) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting
							value={
								isConversionTrackingEnabled
									? __( 'Enabled', 'google-site-kit' )
									: __( 'Disabled', 'google-site-kit' )
							}
						/>
					</p>
				</div>
			) }
		</div>
	);
}
