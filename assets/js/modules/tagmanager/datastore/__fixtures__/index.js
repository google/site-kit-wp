/**
 * Tag Manager datastore fixtures.
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
 * Internal dependencies
 */
import containersAMPOnly from './get-containers--amp.json';
import containersWebOnly from './get-containers--web.json';
import liveContainerVersionAMPWithGA from './live-container-version--amp-ga.json';
import liveContainerVersionAMPNoGA from './live-container-version--amp-no-ga.json';
import liveContainerVersionWebNoGAWithVariable from './live-container-version--web-no-ga-with-variable.json';
import liveContainerVersionWebGAWithOverride from './live-container-version--web-ga-with-override.json';
import liveContainerVersionWebGAWithVariable from './live-container-version--web-ga-with-variable.json';
import liveContainerVersionWebGoogleTag from './live-container-version--web-google-tag.json';
import liveContainerVersionWebGoogleTagWithVariable from './live-container-version--web-google-tag-with-variable.json';

export { default as accounts } from './accounts.json';
export { default as createContainer } from './create-container.json';
export { default as liveContainerVersion } from './live-container-version.json';

export const getContainers = {
	amp: containersAMPOnly,
	web: containersWebOnly,
	all: [ ...containersAMPOnly, ...containersWebOnly ],
};

export const liveContainerVersions = {
	amp: {
		ga: liveContainerVersionAMPWithGA,
		noGA: liveContainerVersionAMPNoGA,
	},
	web: {
		gaWithOverride: liveContainerVersionWebGAWithOverride,
		gaWithVariable: liveContainerVersionWebGAWithVariable,
		noGAWithVariable: liveContainerVersionWebNoGAWithVariable,
		googleTag: liveContainerVersionWebGoogleTag,
		googleTagWithVariable: liveContainerVersionWebGoogleTagWithVariable,
	},
};
