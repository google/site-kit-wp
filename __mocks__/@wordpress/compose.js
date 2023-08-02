/**
 * `@wordpress/compose` mock.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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

const lib = jest.requireActual( '@wordpress/compose' );

// Here we ensure that the `useInstanceId()` hook can be mocked, although
// it initially retains its original implementation.
// The actual mocking of the hook happens in the separate `mockUseInstanceID()`
// helper function.
const wordpressCompose = {
	...lib,
	// eslint-disable-next-line sitekit/acronym-case
	useInstanceId: jest.fn( lib.useInstanceId ),
};

module.exports = wordpressCompose;
