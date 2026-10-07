/**
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * External dependencies
 */
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import useIsIntentSetupFlow from '@/js/hooks/useIsIntentSetupFlow';

// A view-only user can't sign in, so they can't continue the intent the Site
// Kit Service sent them here for. The splash screen URL doesn't say which
// intent that is, so the notice doesn't name it.
const IntentSetupAdminRequiredNotice: FC = () => {
	const isIntentSetupFlow = useIsIntentSetupFlow();
	if ( ! isIntentSetupFlow ) {
		return null;
	}

	return (
		<div className="googlesitekit-setup__notifications">
			<Notice
				type={ NOTICE_TYPES.WARNING }
				title={ __(
					'You need administrator access to continue',
					'google-site-kit'
				) }
				description={ __(
					'Only administrators of this site can sign in to Site Kit and finish this setup. Ask one of them to give you administrator access, then go back to where you started and try again.',
					'google-site-kit'
				) }
			/>
		</div>
	);
};

export default IntentSetupAdminRequiredNotice;
