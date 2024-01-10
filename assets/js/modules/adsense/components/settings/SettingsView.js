/**
 * AdSense Settings View component.
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
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/DisplaySetting';
import Link from '../../../../components/Link';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { ErrorNotices } from '../common';
import {
	getAccountStatusLabel,
	getSiteStatusLabel,
	getSnippetLabel,
	getAutoAdsDisabledMessage,
} from './utils';
import AdBlockingRecoverySetupCTANotice from './AdBlockingRecoverySetupCTANotice';
import VisuallyHidden from '../../../../components/VisuallyHidden';
import {
	BREAKPOINT_SMALL,
	useBreakpoint,
} from '../../../../hooks/useBreakpoint';
import LoadingWrapper from '../../../../components/LoadingWrapper';
const { useSelect } = Data;

export default function SettingsView() {
	const accountID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountID()
	);
	const siteStatusURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceAccountManageSitesURL()
	);
	const webStoriesActive = useSelect( ( select ) =>
		select( CORE_SITE ).isWebStoriesActive()
	);
	const webStoriesAdUnit = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getWebStoriesAdUnit()
	);
	const accountStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountStatus()
	);
	const useAdBlockingRecoverySnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseAdBlockingRecoverySnippet()
	);
	const useAdBlockingRecoveryErrorSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseAdBlockingRecoveryErrorSnippet()
	);

	const siteStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getSiteStatus()
	);
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getUseSnippet()
	);
	const adBlockingRecoverySetupStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus()
	);

	const existingTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getExistingTag()
	);
	const clientID = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getClientID()
	);
	const autoAdsDisabled = useSelect(
		( select ) => select( MODULES_ADSENSE ).getAutoAdsDisabled() || []
	);

	const privacyMessagingURL = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getServiceURL( {
			path: `/${ accountID }/privacymessaging/ad_blocking`,
		} )
	);

	const accountStatusLabel = getAccountStatusLabel( accountStatus );

	const siteStatusLabel = getSiteStatusLabel( siteStatus );

	const siteStatusLinkLabel = createInterpolateElement(
		__(
			'View <VisuallyHidden>site </VisuallyHidden>in AdSense',
			'google-site-kit'
		),
		{
			VisuallyHidden: <VisuallyHidden />,
		}
	);

	const snippetLabel = getSnippetLabel( useSnippet, existingTag, clientID );

	const autoAdsDisabledMessage = getAutoAdsDisabledMessage( autoAdsDisabled );

	const loading = useSelect( ( select ) => {
		// Ensure that `getSettings()` is called here in order to trigger its resolver, which we
		// want to track for the loading state.
		select( MODULES_ADSENSE ).getSettings();

		return select( MODULES_ADSENSE ).isResolving( 'getSettings', [] );
	} );

	const hasExistingAdBlockingRecoveryTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).hasExistingAdBlockingRecoveryTag()
	);

	const breakpoint = useBreakpoint();
	const isSmallScreen = breakpoint === BREAKPOINT_SMALL;

	const metaItemWidth = isSmallScreen ? '75%' : '250px';
	const adblockingCTAHeight = isSmallScreen ? '200px' : '95px';

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--adsense">
			<ErrorNotices />

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<LoadingWrapper
						loading={ loading }
						className="googlesitekit-settings--adsense-loading-item"
						width={ metaItemWidth }
						height="16px"
					>
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Publisher ID', 'google-site-kit' ) }
						</h5>
					</LoadingWrapper>
					<LoadingWrapper
						loading={ loading }
						width={ metaItemWidth }
						height="16px"
					>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ accountID } />
						</p>
					</LoadingWrapper>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<LoadingWrapper
						loading={ loading }
						className="googlesitekit-settings--adsense-loading-item"
						width={ metaItemWidth }
						height="16px"
					>
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Account Status', 'google-site-kit' ) }
						</h5>
					</LoadingWrapper>
					<LoadingWrapper
						loading={ loading }
						width={ metaItemWidth }
						height="16px"
					>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ accountStatusLabel }
						</p>
					</LoadingWrapper>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<LoadingWrapper
						loading={ loading }
						className="googlesitekit-settings--adsense-loading-item"
						width={ metaItemWidth }
						height="16px"
					>
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Site Status', 'google-site-kit' ) }
						</h5>
					</LoadingWrapper>
					<LoadingWrapper
						loading={ loading }
						width={ metaItemWidth }
						height="16px"
					>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ siteStatusLabel + ' ' }
							<Link
								href={ siteStatusURL }
								className="googlesitekit-settings-module__cta-button"
								external
								disabled={ siteStatusURL === undefined }
								hideExternalIndicator={
									siteStatusURL === undefined
								}
							>
								{ siteStatusLinkLabel }
							</Link>
						</p>
					</LoadingWrapper>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<LoadingWrapper
						loading={ loading }
						className="googlesitekit-settings--adsense-loading-item"
						width={ metaItemWidth }
						height="16px"
					>
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'AdSense Code', 'google-site-kit' ) }
						</h5>
					</LoadingWrapper>
					<LoadingWrapper
						loading={ loading }
						width={ metaItemWidth }
						height="16px"
					>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ snippetLabel }
						</p>
					</LoadingWrapper>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<LoadingWrapper
						loading={ loading }
						className="googlesitekit-settings--adsense-loading-item"
						width={ metaItemWidth }
						height="16px"
					>
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'Excluded from ads', 'google-site-kit' ) }
						</h5>
					</LoadingWrapper>
					<LoadingWrapper
						loading={ loading }
						width={ metaItemWidth }
						height="16px"
					>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ autoAdsDisabledMessage }
						</p>
					</LoadingWrapper>
				</div>
			</div>

			{ webStoriesActive && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<LoadingWrapper
							loading={ loading }
							className="googlesitekit-settings--adsense-loading-item"
							width={ metaItemWidth }
							height="16px"
						>
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ __(
									'Web Stories Ad Unit',
									'google-site-kit'
								) }
							</h5>
						</LoadingWrapper>
						<LoadingWrapper
							loading={ loading }
							width={ metaItemWidth }
							height="16px"
						>
							<p className="googlesitekit-settings-module__meta-item-data">
								{ ! webStoriesAdUnit && (
									<span>
										{ __( 'None', 'google-site-kit' ) }
									</span>
								) }
								{ webStoriesAdUnit && (
									<DisplaySetting
										value={ webStoriesAdUnit }
									/>
								) }
							</p>
						</LoadingWrapper>
					</div>
				</div>
			) }

			<LoadingWrapper
				loading={
					loading || hasExistingAdBlockingRecoveryTag === undefined
				}
				className="googlesitekit-settings--adblocking-loading"
				width="100%"
				height={ adblockingCTAHeight }
			>
				{ adBlockingRecoverySetupStatus?.length > 0 && (
					<div className="googlesitekit-settings-module__meta-items">
						<div className="googlesitekit-settings-module__meta-item">
							<h5 className="googlesitekit-settings-module__meta-item-type">
								{ __(
									'Ad blocking recovery',
									'google-site-kit'
								) }
							</h5>
							{ ! useAdBlockingRecoverySnippet && (
								<p className="googlesitekit-settings-module__meta-item-data">
									{ __(
										'Ad blocking recovery message is not placed',
										'google-site-kit'
									) }
								</p>
							) }
							{ useAdBlockingRecoverySnippet && (
								<Fragment>
									<p className="googlesitekit-settings-module__meta-item-data">
										{ useAdBlockingRecoveryErrorSnippet
											? __(
													'Ad blocking recovery message enabled with error protection code',
													'google-site-kit'
											  )
											: __(
													'Ad blocking recovery message enabled without error protection code',
													'google-site-kit'
											  ) }
									</p>
									<p className="googlesitekit-settings-module__meta-item-data">
										{ createInterpolateElement(
											__(
												'Identify site visitors that have an ad blocker browser extension installed. These site visitors will see the ad blocking recovery message created in AdSense. <a>Configure your message</a>',
												'google-site-kit'
											),
											{
												a: (
													<Link
														href={
															privacyMessagingURL
														}
														external
													/>
												),
											}
										) }
									</p>
								</Fragment>
							) }
						</div>
					</div>
				) }

				{ ! adBlockingRecoverySetupStatus?.length && (
					<AdBlockingRecoverySetupCTANotice />
				) }
			</LoadingWrapper>
		</div>
	);
}
