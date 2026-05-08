/**
 * Jest custom matchers for use in E2E tests.
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

// Jest will be extended with all exports from this module automatically.
export { toBeChecked } from './to-be-checked';
export { toHaveAdsTag } from './to-have-ads-tag';
export { toHaveAdSenseTag } from './to-have-adsense-tag';
export { toHaveAMPAutoAdsTag } from './to-have-amp-auto-ads-tag';
export { toHaveTracking } from './to-have-tracking';
export { toHaveValidAMPForUser } from './to-have-valid-amp-for-user';
export { toHaveValidAMPForVisitor } from './to-have-valid-amp-for-visitor';
export { toHaveValue } from './to-have-value';
