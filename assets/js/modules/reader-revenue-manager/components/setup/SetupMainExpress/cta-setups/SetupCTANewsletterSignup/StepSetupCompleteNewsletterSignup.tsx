/**
 * Reader Revenue Manager newsletter signup setup completion details.
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { Fragment, createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { type Select, useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import { StepSetupCompleteDetail } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import {
	CTA,
	CTA_TYPES,
} from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import useHasPreExistingCTAs from './useHasPreExistingCTAs';

const CONTENT_ACCESS_PATH = 'reader-revenue-manager/content-access';
const SUPPORT_URL = 'https://wordpress.org/support/plugin/google-site-kit/';

const StepSetupCompleteNewsletterSignup: FC = () => {
	const hasPreExistingCTAs = useHasPreExistingCTAs();

	const publicationID = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getPublicationID(),
		[]
	);

	// The newsletter CTA created in this flow is the most recent one of its
	// type; its identifier is the last segment of the CTA resource name.
	const newsletterCTAID = useSelect( ( select: Select ) => {
		const ctas: CTA[] | undefined = select(
			MODULES_READER_REVENUE_MANAGER
		).getCTAs();

		const newsletterCTA = ctas
			?.filter( ( { type } ) => type === CTA_TYPES.NEWSLETTER_SIGNUP )
			.pop();

		return newsletterCTA?.name?.split( '/' ).pop();
	}, [] );

	const publisherCenterOverviewURL = useSelect(
		( select: Select ) =>
			select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
				path: `${ CONTENT_ACCESS_PATH }/overview`,
				query: { publication: publicationID },
			} ),
		[ publicationID ]
	);

	// TODO: Confirm the Publisher Center CTA edit screen path as part of #13031,
	// which introduces the same link on the RRM settings screens. Until the CTA
	// is known, fall back to the screen listing the publication's CTAs.
	const publisherCenterCTAEditURL = useSelect(
		( select: Select ) =>
			newsletterCTAID
				? select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
						path: `${ CONTENT_ACCESS_PATH }/ctas/${ newsletterCTAID }`,
						query: { publication: publicationID },
				  } )
				: undefined,
		[ newsletterCTAID, publicationID ]
	);

	return (
		<Fragment>
			{ hasPreExistingCTAs && (
				<StepSetupCompleteDetail
					title={ __( 'Display order', 'google-site-kit' ) }
				>
					{ createInterpolateElement(
						__(
							'Because you already have other CTAs active, this new form will be displayed last. You can reorder your CTAs at any time in the <a>Publisher center</a>',
							'google-site-kit'
						),
						{
							a: (
								<Link
									href={ publisherCenterOverviewURL }
									external
								/>
							),
						}
					) }
				</StepSetupCompleteDetail>
			) }
			<StepSetupCompleteDetail
				title={ __( 'Placement settings', 'google-site-kit' ) }
			>
				{ __(
					'To change where the form appears on your site, go to Site Kit settings.',
					'google-site-kit'
				) }
			</StepSetupCompleteDetail>
			<StepSetupCompleteDetail
				title={ __( 'Content', 'google-site-kit' ) }
			>
				{ createInterpolateElement(
					__(
						'You can edit the content of the CTA any time in <a>Publisher center</a>',
						'google-site-kit'
					),
					{
						a: (
							<Link
								href={
									publisherCenterCTAEditURL ||
									publisherCenterOverviewURL
								}
								external
							/>
						),
					}
				) }
			</StepSetupCompleteDetail>
			<StepSetupCompleteDetail
				title={ __( "Don't see it on your site?", 'google-site-kit' ) }
			>
				{ createInterpolateElement(
					__(
						"If you're still having trouble, <a>contact support</a>",
						'google-site-kit'
					),
					{
						a: <Link href={ SUPPORT_URL } external />,
					}
				) }
			</StepSetupCompleteDetail>
		</Fragment>
	);
};

export default StepSetupCompleteNewsletterSignup;
