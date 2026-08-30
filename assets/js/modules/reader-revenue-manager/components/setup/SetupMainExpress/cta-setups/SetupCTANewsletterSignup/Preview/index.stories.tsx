/**
 * Reader Revenue Manager Newsletter CTA Preview component stories.
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
import type { ComponentProps } from 'react';

/**
 * Internal dependencies
 */
import { Story } from '@/js/types/Story';
import Preview from './index';

type Props = ComponentProps< typeof Preview >;

function Template( args: Props ) {
	return <Preview { ...args } />;
}

export const Default = Template.bind( {} ) as Story< Props >;
Default.storyName = 'Default';
Default.args = {
	ctaTitle: 'Your form header',
	ctaBody: 'Your newsletter sign-up form text',
	consentEnabled: true,
	consentText: 'Your consent text will show here',
};
Default.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTANewsletterSignup/Preview',
	component: Preview,
};
