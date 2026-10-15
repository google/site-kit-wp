/**
 * Reader Revenue Manager express setup `useExpressSetupStepEventLabel` hook.
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
import { Select, useSelect } from 'googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CREATE_PUBLICATION_EVENT_LABEL } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

/**
 * Returns the GA event label for an express setup step.
 *
 * The label is the step slug, except for the publication setup step, which
 * reports `create-publication` while it shows the create form. That form is
 * shown once the publisher chooses it, or as soon as the publications load
 * when there are none, so the label also covers the moment before the step
 * switches to it.
 *
 * @since n.e.x.t
 *
 * @param {string} [slug] Step slug.
 * @return {(string|undefined)} The event label, or `undefined` while the publication setup step is loading its publications.
 */
export default function useExpressSetupStepEventLabel(
	slug?: string
): string | undefined {
	return useSelect(
		( select: Select ) => {
			if ( slug !== EXPRESS_SETUP_STEPS.CONNECT_PUBLICATION ) {
				return slug;
			}

			if (
				select( CORE_FORMS ).getValue(
					READER_REVENUE_MANAGER_SETUP_FORM,
					SHOW_PUBLICATION_CREATE
				)
			) {
				return CREATE_PUBLICATION_EVENT_LABEL;
			}

			const {
				getErrorForSelector,
				getPublications,
				hasFinishedResolution,
			} = select( MODULES_READER_REVENUE_MANAGER );

			if ( ! hasFinishedResolution( 'getPublications' ) ) {
				return undefined;
			}

			const hasNoPublications =
				! getErrorForSelector( 'getPublications', [] ) &&
				! getPublications()?.length;

			return hasNoPublications ? CREATE_PUBLICATION_EVENT_LABEL : slug;
		},
		[ slug ]
	);
}
