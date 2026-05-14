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
import { useSelect } from '@/js/googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { trackEvent } from '@/js/util';
import AnalyticsSVG from '@/svg/graphics/analytics.svg';
import { SIZE_SMALL, TYPE_BODY } from '@/js/components/Typography/constants';

type CheckboxChangeEvent = {
	target: {
		checked: boolean;
	};
};

export default function AnalyticsOptIn() {
	const viewContext = useViewContext();

	const [ checked, setChecked ] = useFormValue(
		ANALYTICS_NOTICE_FORM_NAME,
		ANALYTICS_NOTICE_CHECKBOX
	);

	const handleOnChange = useCallback(
		( event: CheckboxChangeEvent ) => {
			setChecked( event.target.checked );
		},
		[ setChecked ]
	);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const learnMoreLink = useSelect( ( select: any ) => {
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
					{ ...( {
						className:
							'googlesitekit-splash__analytics-recommended-badge',
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
					} as any ) }
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
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						LearnMoreLink: (
							<Link
								{ ...( {
									href: learnMoreLink,
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
								} as any ) }
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
