/**
 * AccountCreateIntro component.
 *
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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Typography from '@/js/components/Typography';
import { SIZE_LARGE, TYPE_TITLE } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';
import { useFeature } from '@/js/hooks/useFeature';
import useViewContext from '@/js/hooks/useViewContext';
import AnalyticsAccountCreationErrorNotice from './AnalyticsAccountCreationErrorNotice';

export interface AccountCreateIntroProps {
	isInitialSetupFlow: boolean;
	accountCreationErrorCode: string;
	onRetry: () => void;
}

const AccountCreateIntro: FC< AccountCreateIntroProps > = ( {
	isInitialSetupFlow,
	accountCreationErrorCode,
	onRetry,
} ) => {
	const setupFlowRefreshEnabled = useFeature( 'setupFlowRefresh' );
	const viewContext = useViewContext();

	const isSettingsContext = viewContext === VIEW_CONTEXT_SETTINGS;

	const errorNotice =
		setupFlowRefreshEnabled && !! accountCreationErrorCode ? (
			<AnalyticsAccountCreationErrorNotice
				errorCode={ accountCreationErrorCode }
				onRetry={ onRetry }
			/>
		) : null;

	return (
		<Fragment>
			{ ! isSettingsContext && errorNotice }

			{ ! isInitialSetupFlow && (
				<Typography as="h3" size={ SIZE_LARGE } type={ TYPE_TITLE }>
					{ __( 'Create your Analytics account', 'google-site-kit' ) }
				</Typography>
			) }

			{ isSettingsContext && errorNotice }

			<P size={ isInitialSetupFlow ? SIZE_LARGE : undefined }>
				{ __(
					'We’ve pre-filled the required information for your new account. Confirm or edit any details:',
					'google-site-kit'
				) }
			</P>
		</Fragment>
	);
};

export default AccountCreateIntro;
