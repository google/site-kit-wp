/**
 * PageSpeed Insights Datastore Fixtures.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { omit } from 'lodash';

/**
 * Internal dependencies
 */
import { default as pagespeedDesktop } from './pagespeed--desktop';
import { default as pagespeedMobile } from './pagespeed--mobile';
const pagespeedDesktopNoFieldData = omit(
	pagespeedDesktop,
	'loadingExperience.metrics'
);
const pagespeedMobileNoFieldData = omit(
	pagespeedMobile,
	'loadingExperience.metrics'
);
const pagespeedDesktopNoStackPacks = omit(
	pagespeedDesktop,
	'lighthouseResult.stackPacks'
);
const pagespeedMobileNoStackPacks = omit(
	pagespeedMobile,
	'lighthouseResult.stackPacks'
);
const pagespeedDesktopNoFieldDataNoStackPacks = omit(
	pagespeedDesktopNoFieldData,
	'lighthouseResult.stackPacks'
);
const pagespeedMobileNoFieldDataNoStackPacks = omit(
	pagespeedMobileNoFieldData,
	'lighthouseResult.stackPacks'
);
const pagespeedDesktopPartialFieldData = omit( pagespeedDesktop, [
	'loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS',
	'loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE',
	'loadingExperience.metrics.FIRST_INPUT_DELAY_MS',
] );
const pagespeedMobilePartialFieldData = omit( pagespeedMobile, [
	'loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS',
	'loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE',
	'loadingExperience.metrics.FIRST_INPUT_DELAY_MS',
] );

export {
	pagespeedDesktop,
	pagespeedDesktopNoFieldData,
	pagespeedDesktopNoStackPacks,
	pagespeedDesktopNoFieldDataNoStackPacks,
	pagespeedMobile,
	pagespeedMobileNoFieldData,
	pagespeedMobileNoStackPacks,
	pagespeedMobileNoFieldDataNoStackPacks,
	pagespeedDesktopPartialFieldData,
	pagespeedMobilePartialFieldData,
};
