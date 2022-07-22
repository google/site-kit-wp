/**
 * Thank with Google SetupCreatePublication component.
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
import Button from '../../../../components/Button';
import { SetupPublicationScreen } from '../common';

export default function SetupCreatePublication() {
	return (
		<SetupPublicationScreen
			title={ __(
				'Create your Thank with Google account',
				'google-site-kit'
			) }
			description={ __(
				'To get started, create an account. Currently available only in the US.',
				'google-site-kit'
			) }
		>
			<Button
				href="https://publishercenter.google.com/"
				target="_blank"
				aria-label={ __(
					'Create your Thank with Google account',
					'google-site-kit'
				) }
			>
				{ __( 'Create account', 'google-site-kit' ) }
			</Button>
		</SetupPublicationScreen>
	);
}
