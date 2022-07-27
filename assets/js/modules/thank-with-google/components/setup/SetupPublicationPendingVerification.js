/**
 * Thank with Google SetupPublicationPendingVerification component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import Link from '../../../../../js/components/Link';
import SetupPublicationScreen from './SetupPublicationScreen';

export default function SetupPublicationPendingVerification() {
	return (
		<SetupPublicationScreen
			title={ __(
				'Reviewing your account application',
				'google-site-kit'
			) }
			description={ __(
				'We received your request to create a Thank with Google account. Check again for updates to your status.',
				'google-site-kit'
			) }
		>
			<Link
				href="https://publishercenter.google.com/"
				external={ true }
				aria-label={ __(
					'Check your status on Thank with Google Publisher Center',
					'google-site-kit'
				) }
				hideExternalIndicator={ true }
			>
				{ __( 'Check your status', 'google-site-kit' ) }
			</Link>
		</SetupPublicationScreen>
	);
}
