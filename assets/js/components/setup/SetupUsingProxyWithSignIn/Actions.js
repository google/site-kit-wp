/**
 * Actions component for SetupUsingProxyWithSignIn.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import OptIn from '../../OptIn';
import ResetButton from '../../ResetButton';

export default function Actions( {
	proxySetupURL,
	onButtonClick,
	goToSharedDashboard,
	isSecondAdmin,
	hasMultipleAdmins,
	hasViewableModules,
	isResettable,
	complete,
	inProgressFeedback,
} ) {
	return (
		<Fragment>
			<OptIn />

			<div className="googlesitekit-start-setup-wrap">
				<Button
					className="googlesitekit-start-setup"
					href={ proxySetupURL }
					onClick={ onButtonClick }
					disabled={ ! complete }
				>
					{ _x(
						'Sign in with Google',
						'Prompt to authenticate Site Kit with Google Account',
						'google-site-kit'
					) }
				</Button>
				{ inProgressFeedback }
				{ hasMultipleAdmins &&
					isSecondAdmin &&
					hasViewableModules &&
					complete && (
						<Button tertiary onClick={ goToSharedDashboard }>
							{ __(
								'Skip sign-in and view limited dashboard',
								'google-site-kit'
							) }
						</Button>
					) }
				{ ! isSecondAdmin && isResettable && complete && (
					<ResetButton />
				) }
			</div>
		</Fragment>
	);
}
