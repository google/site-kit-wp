/**
 * Analytics Settings View component.
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
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createInterpolateElement, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
} from '../../../analytics-4/datastore/constants';
import { trackingExclusionLabels } from '../common/TrackingExclusionSwitches';
import { ExistingGTMPropertyNotice } from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import Link from '../../../../components/Link';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import { escapeURI } from '../../../../util/escape-uri';
const { useSelect } = Data;

export default function SettingsView() {
	const ga4PropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const ga4MeasurementID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getMeasurementID()
	);
	const webDataStreamID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getWebDataStreamID()
	);
	const useGA4Snippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getUseSnippet()
	);

	const accountID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAccountID()
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getPropertyID()
	);
	const internalWebPropertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getInternalWebPropertyID()
	);
	const profileID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getProfileID()
	);
	const adsConversionID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAdsConversionID()
	);

	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);
	const canUseSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getCanUseSnippet()
	);

	const anonymizeIP = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAnonymizeIP()
	);
	const trackingDisabled =
		useSelect( ( select ) =>
			select( MODULES_ANALYTICS ).getTrackingDisabled()
		) || [];
	const ampMode = useSelect( ( select ) => select( CORE_SITE ).getAMPMode() );

	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasExistingTag()
	);

	const editViewSettingsURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getServiceURL( {
			path: escapeURI`/a${ accountID }w${ internalWebPropertyID }p${ profileID }/admin/view/settings`,
		} )
	);

	const editDataStreamSettingsURL = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getServiceURL( {
			path: escapeURI`/a${ accountID }p${ ga4PropertyID }/admin/streams/table/${ webDataStreamID }`,
		} )
	);

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">
			<StoreErrorNotices
				moduleSlug="analytics"
				storeName={ MODULES_ANALYTICS }
			/>
			<ExistingGTMPropertyNotice />

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Account', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ accountID } />
					</p>
				</div>
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
						{ __( 'View', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ profileID } />
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
					<p className="googlesitekit-settings-module__meta-item-data googlesitekit-settings-module__meta-item-data--tiny">
						<Link href={ editViewSettingsURL } external>
							{ createInterpolateElement(
								__(
									'Edit <VisuallyHidden>Universal Analytics property view </VisuallyHidden>in Analytics',
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
						{ __(
							'Universal Analytics Code Snippet',
							'google-site-kit'
						) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ canUseSnippet === false && (
							<span>
								{ __(
									'The code is controlled by the Tag Manager module',
									'google-site-kit'
								) }
							</span>
						) }
						{ canUseSnippet && useSnippet && (
							<span>
								{ __(
									'Snippet is inserted',
									'google-site-kit'
								) }
							</span>
						) }
						{ canUseSnippet && ! useSnippet && ! hasExistingTag && (
							<span>
								{ __(
									'Snippet is not inserted',
									'google-site-kit'
								) }
							</span>
						) }
						{ canUseSnippet && ! useSnippet && hasExistingTag && (
							<span>
								{ __(
									'Inserted by another plugin or theme',
									'google-site-kit'
								) }
							</span>
						) }
					</p>
				</div>
			</div>

			{ ga4PropertyID && ga4PropertyID !== PROPERTY_CREATE && (
				<Fragment>
					<div className="googlesitekit-settings-module__meta-items">
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ __(
									'Google Analytics 4 Property',
									'google-site-kit'
								) }
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								<DisplaySetting value={ ga4PropertyID } />
							</p>
						</div>
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ createInterpolateElement(
									__(
										'<VisuallyHidden>Google Analytics 4</VisuallyHidden> Measurement ID',
										'google-site-kit'
									),
									{
										VisuallyHidden: <VisuallyHidden />,
									}
								) }
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								<DisplaySetting value={ ga4MeasurementID } />
							</p>
						</div>
						<div className="googlesitekit-settings-module__meta-item googlesitekit-settings-module__meta-item--data-only">
							<p className="googlesitekit-settings-module__meta-item-data googlesitekit-settings-module__meta-item-data--tiny">
								<Link
									href={ editDataStreamSettingsURL }
									external
								>
									{ createInterpolateElement(
										__(
											'Edit <VisuallyHidden>Google Analytics 4 web data stream </VisuallyHidden>in Analytics',
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
								{ __(
									'Google Analytics 4 Code Snippet',
									'google-site-kit'
								) }
							</h5>
							<p className="googlesitekit-settings-module__meta-item-data">
								{ useGA4Snippet && (
									<span>
										{ __(
											'Snippet is inserted',
											'google-site-kit'
										) }
									</span>
								) }
								{ ! useGA4Snippet && (
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
				</Fragment>
			) }

			{ useSnippet && ampMode !== 'primary' && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __(
								'IP Address Anonymization',
								'google-site-kit'
							) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ anonymizeIP && (
								<span>
									{ __(
										'IP addresses are being anonymized',
										'google-site-kit'
									) }
								</span>
							) }
							{ ! anonymizeIP && (
								<span>
									{ __(
										'IP addresses are not being anonymized',
										'google-site-kit'
									) }
								</span>
							) }
						</p>
					</div>
				</div>
			) }

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Excluded from Analytics', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ !! trackingDisabled.length &&
							trackingDisabled
								.map(
									( exclusion ) =>
										trackingExclusionLabels[ exclusion ]
								)
								.join(
									_x(
										', ',
										'list separator',
										'google-site-kit'
									)
								) }
						{ ! trackingDisabled.length &&
							__(
								'Analytics is currently enabled for all visitors',
								'google-site-kit'
							) }
					</p>
				</div>
			</div>

			{ canUseSnippet && useSnippet && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Ads Conversion ID', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ adsConversionID ? (
								<DisplaySetting value={ adsConversionID } />
							) : (
								__( 'None', 'google-site-kit' )
							) }
						</p>
					</div>
				</div>
			) }
		</div>
	);
}
