/**
 * Notifications utilities.
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
import { Registry } from 'googlesitekit-data';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Checks whether a given CTA type has an abandoned setup.
 *
 * @since n.e.x.t
 *
 * @param {Registry} registry Data registry.
 * @param {string}   ctaType  CTA type slug.
 * @return {Promise<boolean>} Whether the CTA type has an abandoned setup.
 */
export async function checkRequirementsForExpressSetupResumeNotification(
	registry: Registry,
	ctaType: string
): Promise< boolean > {
	const { resolveSelect } = registry;

	const [ settings, userSettings ] = await Promise.all( [
		resolveSelect( MODULES_READER_REVENUE_MANAGER ).getSettings(),
		resolveSelect( MODULES_READER_REVENUE_MANAGER ).getUserSettings(),
	] );

	if ( ! settings || ! userSettings ) {
		return false;
	}

	const { configuredCTAs = {} } = settings;
	const { lastActionedExpressSetups = {} } = userSettings;

	const isActioned = !! lastActionedExpressSetups[ ctaType ];
	const isConfigured = Object.values( configuredCTAs ).includes( ctaType );

	return isActioned && ! isConfigured;
}
