/**
 * Reader Revenue Manager `SurveyCustomDimensionsError` component.
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
import type { FC, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import Notice from '@/js/components/Notice';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import { CORE_LOCATION } from '@/js/googlesitekit/datastore/location/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { sanitizeHTML } from '@/js/util';
import {
	ErrorObject,
	getErrorNoticeMessage,
	isInsufficientPermissionsError,
} from '@/js/util/errors';

const sanitizeArgs = {
	ALLOWED_TAGS: [ 'a' ],
	ALLOWED_ATTR: [ 'href' ],
};

interface SurveyCustomDimensionsErrorProps {
	error: ErrorObject;
}

const SurveyCustomDimensionsError: FC< SurveyCustomDimensionsErrorProps > = ( {
	error,
} ) => {
	const { navigateTo } = useDispatch( CORE_LOCATION );

	const dashboardURL = useSelect(
		( select: Select ): string | undefined =>
			select( CORE_SITE ).getAdminURL( 'googlesitekit-dashboard' ),
		[]
	);

	const helpLink = useSelect(
		( select: Select ): string | undefined =>
			select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: 'analytics-4_insufficient_permissions',
			} ),
		[]
	);

	const onReturnClick = useCallback( () => {
		if ( dashboardURL ) {
			navigateTo( dashboardURL );
		}
	}, [ dashboardURL, navigateTo ] );

	const ctaButton = {
		label: __( 'Return to dashboard', 'google-site-kit' ),
		onClick: onReturnClick,
	};

	if ( isInsufficientPermissionsError( error ) ) {
		return (
			<Notice
				type={ NOTICE_TYPES.ERROR }
				title={ __(
					'We were unable to configure your Google Analytics account settings for your survey due to insufficient permissions',
					'google-site-kit'
				) }
				description={
					createInterpolateElement(
						__(
							'This step is required before you can set up your survey. To fix this, contact your administrator or <a>get help</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ helpLink }
									external
									hideExternalIndicator
								/>
							),
						}
					) as ReactNode
				}
				ctaButton={ ctaButton }
			/>
		);
	}

	const message = getErrorNoticeMessage( error.message, error, {
		skipRetryMessage: true,
	} );

	return (
		<Notice
			type={ NOTICE_TYPES.ERROR }
			description={
				// The error message from the API can contain links, so it is
				// sanitized and rendered as HTML, as `ErrorNotice` does.
				<span
					dangerouslySetInnerHTML={ sanitizeHTML(
						message,
						sanitizeArgs
					) }
				/>
			}
			ctaButton={ ctaButton }
		/>
	);
};

export default SurveyCustomDimensionsError;
