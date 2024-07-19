/**
 * Publication onboarding state notice component.
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
import InfoIcon from '../../../../../svg/icons/info-circle.svg';
import Link from '../../../../components/Link';
import { PUBLICATION_ONBOARDING_STATES } from '../../datastore/constants';
import SettingsNotice from '../../../../components/SettingsNotice';
import { useSelect } from '@wordpress/data';

export default function PublicationOnboardingStateNotice() {
	// Destructure the onboarding states from the constant.
	const { PENDING_VERIFICATION, ONBOARDING_ACTION_REQUIRED } =
		PUBLICATION_ONBOARDING_STATES;

	// Get the onboarding state from the store.
	const onboardingstate = useSelect( ( select ) =>
		select(
			'modules/reader-revenue-manager'
		).getPublicationOnboardingState( 'reader-revenue-manager' )
	);

	// States for which the notice should be displayed.
	const actionableOnboardingStates = [
		PENDING_VERIFICATION,
		ONBOARDING_ACTION_REQUIRED,
	];

	const publicationID = useSelect( ( select ) =>
		select( 'modules/reader-revenue-manager' ).getPublicationID()
	);

	const serviceURL = useSelect( ( select ) =>
		select( 'modules/reader-revenue-manager' ).getServiceURL( {
			path: '/reader-revenue-manager',
			publicationID,
		} )
	);

	// If the onboarding state is not present or is not actionable, return null.
	if (
		! onboardingstate ||
		! actionableOnboardingStates.includes( onboardingstate )
	) {
		return null;
	}

	const noticeCTA = () => {
		// Get the service URL from the store.
		return (
			<Link href={ serviceURL } external inverse>
				{ __( 'Complete publication setup', 'google-site-kit' ) }
			</Link>
		);
	};

	const noticeText =
		PENDING_VERIFICATION === onboardingstate
			? __(
					'Your publication is still awaiting review. you can check its status in Reader Revenue Manager.',
					'google-site-kit'
			  )
			: __(
					'Your publication requires further setup in Reader Revenue Manager.',
					'google-site-kit'
			  );

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
