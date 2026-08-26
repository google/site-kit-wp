/**
 * Reader Revenue Manager StepSetupComplete component stories.
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
import { ComponentProps, ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Story } from '@/js/types/Story';
import ExternalIcon from '@/svg/icons/external.svg';
import StepSetupComplete from './StepSetupComplete';
import StepSetupCompleteDetail from './StepSetupCompleteDetail';

type Props = ComponentProps< typeof StepSetupComplete >;

function Template( args: Props ) {
	return <StepSetupComplete { ...args } />;
}

export const Default = Template.bind( {} ) as Story< Props >;
Default.storyName = 'Default';
Default.scenario = {};

export const WithCTADetails = Template.bind( {} ) as Story< Props >;
WithCTADetails.storyName = 'With CTA Details';
WithCTADetails.args = {
	title: __( 'Your newsletter signup form is ready!', 'google-site-kit' ),
	secondaryCTA: (
		// @ts-expect-error `Button` component is not yet typed.
		<Button
			onClick={ () => {} }
			trailingIcon={ <ExternalIcon width="15" height="15" /> }
			tertiary
		>
			{ __( 'View on your site', 'google-site-kit' ) }
		</Button>
	),
	children: (
		<StepSetupCompleteDetail
			title={ __( 'Placement settings', 'google-site-kit' ) }
		>
			{ __(
				'To change where the form appears on your site, go to Site Kit settings.',
				'google-site-kit'
			) }
		</StepSetupCompleteDetail>
	),
};
WithCTADetails.parameters = {
	query: {
		cta: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
	},
};
WithCTADetails.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/StepSetupComplete',
	component: StepSetupComplete,
	decorators: [ withQuery ],
};
