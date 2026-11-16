/**
 * Reader Revenue Manager express setup existing CTA step stories.
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
import { withQuery } from '@storybook/addon-queryparams';
import { ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PublisherCenterLink from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/PublisherCenterLink';
import {
	EXPRESS_SETUP_CTAS,
	EXPRESS_SETUP_STEPS,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Story } from '@/js/types/Story';
import StepExistingCTA from './StepExistingCTA';

type Props = ComponentProps< typeof StepExistingCTA >;

function Template( args: Props ) {
	return <StepExistingCTA { ...args } />;
}

export const Default = Template.bind( {} ) as Story< Props >;
Default.storyName = 'Default';
Default.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/StepExistingCTA',
	component: StepExistingCTA,
	args: {
		title: 'We found an existing newsletter sign-up form for this publication',
		description: createInterpolateElement(
			'Your publication is now connected to Site Kit. However, Site Kit can’t create a newsletter sign-up form for a publication that already has one in Reader Revenue Manager. To view or edit your publications, go to <a>Publisher Center</a>',
			{
				a: (
					<PublisherCenterLink eventName="click_view_publications_link" />
				),
			}
		),
		targetingDescription: createInterpolateElement(
			'To change who sees your newsletter sign-up form, set targeting rules in <a>Publisher Center</a>',
			{
				a: (
					<PublisherCenterLink eventName="click_set_targeting_rules_link" />
				),
			}
		),
		onComplete: () => {},
	},
	parameters: {
		query: {
			cta: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
			step: EXPRESS_SETUP_STEPS.EXISTING_CTA,
		},
	},
	decorators: [ withQuery ],
};
