/**
 * Analytics Datastore Fixtures.
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

import defaultSettings from './settings--default.json';

export { default as accountsPropertiesProfiles } from './accounts-properties-profiles.json';
export { default as createProfile } from './create-profile.json';
export { default as createProperty } from './create-property.json';
export { default as goals } from './goals.json';
export { default as profiles } from './profiles.json';
export { default as propertiesProfiles } from './properties-profiles.json';
export { default as getTagPermissionsAccess } from './tag-permissions-access.json';
export { default as getTagPermissionsNoAccess } from './tag-permissions-no-access.json';
export { default as createAccount } from './create-account.json';
export { default as report } from './report.json';
export { default as pageTitles } from './page-titles.json';
export { default as defaultSettings } from './settings--default.json';

export const settings = {
	default: defaultSettings,
};
