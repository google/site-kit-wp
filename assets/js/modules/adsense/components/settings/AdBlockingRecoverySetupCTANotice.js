/**
 * AdBlockingRecoverySetupCTANotice component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import {
	Fragment,
	createInterpolateElement,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import Data from 'googlesitekit-data';
import Badge from '../../../../components/Badge';
import SettingsNotice from '../../../../components/SettingsNotice/SettingsNotice';
import SupportLink from '../../../../components/SupportLink';
import { CORE_LOCATION } from '../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { useInView } from '../../../../hooks/useInView';
import useViewContext from '../../../../hooks/useViewContext';
import { trackEvent } from '../../../../util';
import { MODULES_ADSENSE } from '../../datastore/constants';
import { ACCOUNT_STATUS_READY, SITE_STATUS_READY } from '../../util';

const { useDispatch, useSelect } = Data;

export default function AdBlockingRecoverySetupCTANotice() {
	const inView = useInView();
	const viewContext = useViewContext();

	const adBlockingRecoverySetupStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdBlockingRecoverySetupStatus()
	);
	const accountStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAccountStatus()
	);
	const siteStatus = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getSiteStatus()
	);
	const hasExistingAdBlockingRecoveryTag = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).hasExistingAdBlockingRecoveryTag()
	);
	const recoveryPageURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-ad-blocking-recovery' )
	);

	const { navigateTo } = useDispatch( CORE_LOCATION );

	const isCTAHidden =
		hasExistingAdBlockingRecoveryTag === undefined ||
		hasExistingAdBlockingRecoveryTag ||
		adBlockingRecoverySetupStatus !== '' ||
		accountStatus !== ACCOUNT_STATUS_READY ||
		siteStatus !== SITE_STATUS_READY;

	useEffect( () => {
		if ( inView && ! isCTAHidden ) {
			trackEvent(
				`${ viewContext }_adsense-abr-cta-widget`,
				'view_notification'
			);
		}
	}, [ inView, isCTAHidden, viewContext ] );

	const handleCTAClick = async () => {
		await trackEvent(
			`${ viewContext }_adsense-abr-cta-widget`,
			'confirm_notification'
		);
		return navigateTo( recoveryPageURL );
	};

	const handleLearnMoreClick = () => {
		trackEvent(
			`${ viewContext }_adsense-abr-cta-widget`,
			'click_learn_more_link'
		);
	};

	if ( isCTAHidden ) {
		return null;
	}

	return (
		<SettingsNotice
			notice={
				<Fragment>
					{ __( 'Ad blocking recovery', 'google-site-kit' ) }
					<Badge
						className="googlesitekit-new-badge"
						label={ __( 'New', 'google-site-kit' ) }
					/>
				</Fragment>
			}
			className="googlesitekit-settings-notice-ad-blocking-recovery-cta"
			OuterCTA={ () => (
				<Button onClick={ handleCTAClick }>
					{ __( 'Set up now', 'google-site-kit' ) }
				</Button>
			) }
		>
			{ createInterpolateElement(
				__(
					'Start recovering revenue lost from ad blockers by deploying an ad blocking recovery message through Site Kit. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<SupportLink
							path="/adsense/answer/11576589"
							external
							hideExternalIndicator
							onClick={ handleLearnMoreClick }
						/>
					),
				}
			) }
		</SettingsNotice>
	);
}
