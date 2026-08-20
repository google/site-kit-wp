/**
 * Feature Discovery public API entrypoint.
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
import Data from 'googlesitekit-data';
import {
	actions,
	createFeatureDiscovery,
	registerStore,
	selectors,
} from './googlesitekit/feature-discovery';
import { registerDefaults } from './googlesitekit/feature-discovery/register-defaults';

// Register the feature-discovery store.
registerStore( Data );

// Create the Feature Discovery API instance.
const FeatureDiscovery = createFeatureDiscovery( Data );

// Register default features from core Site Kit.
registerDefaults( FeatureDiscovery );

// Export the API for use by modules and external callers.
export default FeatureDiscovery;
export { actions, createFeatureDiscovery, registerStore, selectors };

// Expose the API on the global object for third-party integrations.
if ( ! global.googlesitekit ) {
	global.googlesitekit = {};
}
global.googlesitekit.featureDiscovery = FeatureDiscovery;
