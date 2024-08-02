/**
 * RRMSetupSuccessSubtleNotification component.
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
import SubtleNotification from '../../../../components/notifications/SubtleNotification';
import useQueryArg from '../../../../hooks/useQueryArg';
import whenActive from '../../../../util/when-active';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';

function RRMSetupSuccessSubtleNotification() {
	const [ notification, setNotification ] = useQueryArg( 'notification' );
	const [ slug, setSlug ] = useQueryArg( 'slug' );

	const publicationOnboardingState = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationOnboardingState()
	);

	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);

	const serviceURL = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
			publicationID,
		} )
	);

	const onDismiss = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	if (
		'authentication_success' !== notification ||
		slug !== 'reader-revenue-manager' ||
		publicationOnboardingState === undefined
	) {
		return null;
	}

	if (
		publicationOnboardingState ===
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
	) {
		return (
			<SubtleNotification
				title={ __(
					'Your Reader Revenue Manager account was successfully set up!',
					'google-site-kit'
				) }
				description={ __(
					'Unlock your full reader opportunity by enabling features like subscriptions, contributions and newsletter sign ups in the Reader Revenue Manager settings.',
					'google-site-kit'
				) }
				onDismiss={ onDismiss }
				dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
				ctaLink={ serviceURL }
				ctaLabel={ __( 'Customize settings', 'google-site-kit' ) }
				isCTALinkExternal
			/>
		);
	}

	if (
		publicationOnboardingState ===
		PUBLICATION_ONBOARDING_STATES.PENDING_VERIFICATION
	) {
		return (
			<SubtleNotification
				title={ __(
					'Your Reader Revenue Manager account was successfully set up!',
					'google-site-kit'
				) }
				description={ __(
					'Your publication is still awaiting review, you can check its status in Reader Revenue Manager.',
					'google-site-kit'
				) }
				onDismiss={ onDismiss }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
				ctaLink={ serviceURL }
				ctaLabel={ __( 'Check publication status', 'google-site-kit' ) }
				isCTALinkExternal
			/>
		);
	}

	if (
		publicationOnboardingState ===
		PUBLICATION_ONBOARDING_STATES.ONBOARDING_ACTION_REQUIRED
	) {
		return (
			<SubtleNotification
				title={ __(
					'Your Reader Revenue Manager account was successfully set up, but your publication still requires further setup in Reader Revenue Manager.',
					'google-site-kit'
				) }
				onDismiss={ onDismiss }
				dismissLabel={ __( 'Got it', 'google-site-kit' ) }
				ctaLink={ serviceURL }
				ctaLabel={ __(
					'Complete publication setup',
					'google-site-kit'
				) }
				isCTALinkExternal
				variant="warning"
			/>
		);
	}

	return null;
}

export default whenActive( { moduleName: 'reader-revenue-manager' } )(
	RRMSetupSuccessSubtleNotification
);
