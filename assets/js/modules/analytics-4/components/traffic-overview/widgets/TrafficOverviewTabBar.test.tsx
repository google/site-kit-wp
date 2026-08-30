/**
 * Traffic Overview tab bar tests.
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
import { fireEvent, render, screen } from '@tests/js/test-utils';
import TrafficOverviewTabBar, {
	TrafficOverviewTab,
} from './TrafficOverviewTabBar';

describe( 'TrafficOverviewTabBar', () => {
	const tabs: TrafficOverviewTab[] = [
		{ id: 'traffic-overview', label: 'Traffic Overview' },
		{ id: 'typical-traffic', label: 'Typical traffic' },
	];

	/**
	 * Renders the tab bar with a mock `onTabChange` and returns it alongside the render result.
	 *
	 * @since n.e.x.t
	 *
	 * @param {string} [activeTabID] Optional. The `id` of the tab to start on.
	 * @return {Object} The render result, plus the mock `onTabChange`.
	 */
	function renderTabBar( activeTabID = 'traffic-overview' ) {
		const onTabChange = jest.fn();

		const result = render(
			<TrafficOverviewTabBar
				tabs={ tabs }
				activeTabID={ activeTabID }
				onTabChange={ onTabChange }
			/>
		);

		return { ...result, onTabChange };
	}

	it( 'renders the tabs in order, showing each label and setting each tab id', () => {
		renderTabBar();

		const renderedTabs = screen.getAllByRole( 'tab' );

		expect(
			renderedTabs.map( ( tab ) => [ tab.id, tab.textContent ] )
		).toEqual( [
			[ 'traffic-overview', 'Traffic Overview' ],
			[ 'typical-traffic', 'Typical traffic' ],
		] );
	} );

	it( 'marks the active tab as selected', () => {
		renderTabBar( 'typical-traffic' );

		expect(
			screen.getByRole( 'tab', { selected: true } )
		).toHaveTextContent( 'Typical traffic' );
	} );

	it( 'marks the first tab as selected when the active tab id matches no tab', () => {
		renderTabBar( 'no-such-tab' );

		expect(
			screen.getByRole( 'tab', { selected: true } )
		).toHaveTextContent( 'Traffic Overview' );
	} );

	it( 'calls onTabChange with the id of the tab the user clicks', () => {
		const { onTabChange } = renderTabBar();

		fireEvent.click(
			screen.getByRole( 'tab', { name: 'Typical traffic' } )
		);

		expect( onTabChange ).toHaveBeenCalledWith( 'typical-traffic' );
		expect( onTabChange ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls onTabChange with the id of the next tab when the user presses the right arrow key and then Enter', () => {
		const { onTabChange } = renderTabBar();

		const [ firstTab ] = screen.getAllByRole( 'tab' );
		firstTab.focus();

		fireEvent.keyDown( screen.getByRole( 'tablist' ), {
			key: 'ArrowRight',
			keyCode: 39,
		} );
		fireEvent.keyDown( screen.getByRole( 'tablist' ), {
			key: 'Enter',
			keyCode: 13,
		} );

		expect( onTabChange ).toHaveBeenCalledWith( 'typical-traffic' );
		expect( onTabChange ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'calls onTabChange with the id of the previous tab when the user presses the left arrow key and then Enter', () => {
		const { onTabChange } = renderTabBar( 'typical-traffic' );

		const [ , secondTab ] = screen.getAllByRole( 'tab' );
		secondTab.focus();

		fireEvent.keyDown( screen.getByRole( 'tablist' ), {
			key: 'ArrowLeft',
			keyCode: 37,
		} );
		fireEvent.keyDown( screen.getByRole( 'tablist' ), {
			key: 'Enter',
			keyCode: 13,
		} );

		expect( onTabChange ).toHaveBeenCalledWith( 'traffic-overview' );
		expect( onTabChange ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'leaves the selected tab unchanged when the user presses Enter with no tab focused', () => {
		const { onTabChange } = renderTabBar();

		// MDC reads the focused tab's index, which is `-1` when no tab holds
		// focus, and asks the tab bar to select that index. No tab sits at
		// `-1`, so the tab bar never calls `onTabChange`.
		fireEvent.keyDown( screen.getByRole( 'tablist' ), {
			key: 'Enter',
			keyCode: 13,
		} );

		expect( onTabChange ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'tab', { selected: true } )
		).toHaveTextContent( 'Traffic Overview' );
	} );

	it( 'renders the tab bar inside the scrollable tabs wrapper', () => {
		const { container } = renderTabBar();

		expect(
			container.querySelector(
				'.googlesitekit-scrollable-tabs .mdc-tab-bar'
			)
		).not.toBeNull();
	} );
} );
