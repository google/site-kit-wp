/**
 * SetupUsingProxyWithSignIn AnalyticsOptIn component.
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
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Checkbox from '@/js/googlesitekit/components-gm2/Checkbox';
import Badge from '@/js/components/Badge';
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import useFormValue from '@/js/hooks/useFormValue';
import useViewContext from '@/js/hooks/useViewContext';
import {
	ANALYTICS_NOTICE_CHECKBOX,
	ANALYTICS_NOTICE_FORM_NAME,
} from '@/js/components/setup/constants';
import type { Select } from '@/js/googlesitekit/data/types';
import { useSelect } from '@/js/googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { trackEvent } from '@/js/util';
import AnalyticsSVG from '@/svg/graphics/analytics.svg';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';

export default function AnalyticsOptIn() {
	const viewContext = useViewContext();

	const [ checked, setChecked ] = useFormValue(
		ANALYTICS_NOTICE_FORM_NAME,
		ANALYTICS_NOTICE_CHECKBOX
	);

	const handleOnChange = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			setChecked( event.target.checked );
		},
		[ setChecked ]
	);

	const learnMoreLink = useSelect( ( select: Select ) => {
		return select( CORE_SITE ).getDocumentationLinkURL(
			'setup-update-ga4-account'
		);
	}, [] );

	return (
		<div className="googlesitekit-setup__analytics-opt-in-wrapper">
			<div className="googlesitekit-setup__analytics-opt-in-wrapper-header">
				<AnalyticsSVG width={ 24 } height={ 27 } />
				<Typography
					size={ SIZE_SMALL }
					type={ TYPE_BODY }
					className="googlesitekit-setup__analytics-opt-in-wrapper-header-title"
				>
					{ __( 'Analytics', 'google-site-kit' ) }
				</Typography>
				<Badge
					// @ts-expect-error Badge component types do not include className yet.
					className="googlesitekit-splash__analytics-recommended-badge"
					label={ __( 'Recommended', 'google-site-kit' ) }
				/>
			</div>
			<Checkbox
				id="googlesitekit-analytics-setup-opt-in"
				name="googlesitekit-analytics-setup-opt-in"
				description={ createInterpolateElement(
					__(
						'To get better insights about your site, Site Kit will update your Analytics account, for example by enabling enhanced measurement. <LearnMoreLink />',
						'google-site-kit'
					),
					{
						LearnMoreLink: (
							// @ts-expect-error Link component types do not include full props yet.
							<Link
								href={ learnMoreLink }
								onClick={ () => {
									trackEvent(
										viewContext,
										'click_learn_more_link',
										'analytics_checkbox'
									);
								} }
							>
								{ __( 'Learn more', 'google-site-kit' ) }
							</Link>
						),
					}
				) }
				checked={ !! checked }
				onChange={ handleOnChange }
				value="1"
			>
				{ __(
					'Get visitor insights by connecting Google Analytics as part of setup',
					'google-site-kit'
				) }
			</Checkbox>
		</div>
	);
}
