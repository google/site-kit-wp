/**
 * Reader Revenue Manager PublicationOnboardingStateNotice component.
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

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import InfoIcon from '../../../../../svg/icons/info-circle.svg';
import Link from '../../../../components/Link';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';
import SettingsNotice from '../../../../components/SettingsNotice';

const { PENDING_VERIFICATION, ONBOARDING_ACTION_REQUIRED } =
	PUBLICATION_ONBOARDING_STATES;

export default function PublicationOnboardingStateNotice() {
	const onboardingState = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationOnboardingState()
	);

	const actionableOnboardingStates = [
		PENDING_VERIFICATION,
		ONBOARDING_ACTION_REQUIRED,
	];

	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);

	const serviceURL = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
			path: '/reader-revenue-manager',
			publicationID,
		} )
	);

	if (
		! onboardingState ||
		! actionableOnboardingStates.includes( onboardingState )
	) {
		return null;
	}

	const noticeText =
		PENDING_VERIFICATION === onboardingState
			? __(
					'Your publication is still awaiting review. You can check its status in Reader Revenue Manager.',
					'google-site-kit'
			  )
			: __(
					'Your publication requires further setup in Reader Revenue Manager',
					'google-site-kit'
			  );

	const buttonText =
		PENDING_VERIFICATION === onboardingState
			? __( 'Check publication status', 'google-site-kit' )
			: __( 'Complete publication setup', 'google-site-kit' );

	const noticeCTA = () => {
		return (
			<Link href={ serviceURL } external inverse>
				{ buttonText }
			</Link>
		);
	};

	return (
		<SettingsNotice
			className="googlesitekit-publication-onboarding-state-notice"
			type="warning"
			Icon={ InfoIcon }
			notice={ noticeText }
			OuterCTA={ noticeCTA }
		/>
	);
}
