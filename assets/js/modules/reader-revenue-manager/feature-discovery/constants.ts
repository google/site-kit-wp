/**
 * Reader Revenue Manager feature discovery constants.
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
 * Internal dependencies
 */
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';

// The Feature Discovery catalog's slug for the newsletter sign-up feature. This
// is the feature slug, not the express setup CTA slug, even though the values
// match.
export const FEATURE_SLUG_NEWSLETTER_SIGNUP = 'newsletter-signup';

// Maps each express setup CTA that has a Feature Discovery catalog entry to
// that feature's slug, so that setup completion can find the feature a CTA's
// setup was started for. CTAs without a catalog entry are left out.
export const EXPRESS_SETUP_CTA_TO_FEATURE_SLUG: Record< string, string > = {
	[ EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP ]: FEATURE_SLUG_NEWSLETTER_SIGNUP,
};
