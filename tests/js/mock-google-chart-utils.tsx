/**
 * Mock GoogleChart utils.
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
 * Returns the `GoogleChart` module with its component replaced by a spy, for
 * `jest.mock()`.
 *
 * Google Charts loads from the web and draws nothing under Jest. The spy
 * renders an empty chart container and keeps the props of each render, so a
 * test reads what the chart received.
 *
 * @since n.e.x.t
 *
 * @return {Object} The `GoogleChart` module, with a `jest.fn()` as its default export.
 */
export function mockGoogleChartModule() {
	return {
		__esModule: true,
		default: jest.fn( () => <div className="googlesitekit-chart" /> ),
	};
}
