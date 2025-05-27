/**
 * Settings constants.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

import { MODULE_SLUG_ADS } from '../../modules/ads/datastore/constants';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '../../modules/sign-in-with-google/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '../../modules/reader-revenue-manager/datastore/constants';

export const NEW_MODULES = [
	MODULE_SLUG_ADS,
	MODULE_SLUG_READER_REVENUE_MANAGER,
	MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
];

export const BETA_MODULES = [ MODULE_SLUG_SIGN_IN_WITH_GOOGLE ];

export const EXPERIMENTAL_MODULES = [];
