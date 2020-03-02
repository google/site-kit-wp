/**
 * NotificationCounter component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
 * External dependencies
 */
import classnames from 'classnames';
import { getTotalNotifications, incrementCount, decrementCount } from 'GoogleComponents/notifications/util';

/**
 * WordPress dependencies
 */
import { Component, createPortal } from '@wordpress/element';
import { _n, sprintf } from '@wordpress/i18n';
import { addAction, removeAction } from '@wordpress/hooks';

class NotificationCounter extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			count: 0,
		};

		this.handleIncrement = this.handleIncrement.bind( this );
		this.handleDecrement = this.handleDecrement.bind( this );
	}

	componentDidMount() {
		// Wait until data is fully loaded before requesting notifications data.
		addAction(
			'googlesitekit.dataLoaded',
			'googlesitekit.dataLoadedGetNotifications',
			() => {
				// Only handle the first completed data load.
				removeAction(
					'googlesitekit.dataLoaded',
					'googlesitekit.dataLoadedGetNotifications'
				);
				getTotalNotifications().then( ( count ) => {
					this.setState( { count } );
				} );
			}
		);

		document.addEventListener( 'notificationDismissed', this.handleDecrement, false );
	}

	componentWillUnmount() {
		document.removeEventListener( 'notificationDismissed', this.handleDecrement );
	}

	handleIncrement() {
		this.setState( incrementCount );
	}

	handleDecrement() {
		this.setState( decrementCount );
	}

	render() {
		const screenReader = sprintf(
			_n(
				'%d notification',
				'%d notifications',
				this.state.count,
				'google-site-kit'
			),
			this.state.count
		);

		const markup = (
			<span className={ classnames(
				'googlesitekit-notifications-counter',
				'update-plugins',
				`count-${ this.state.count }`
			) }>
				<span className="plugin-count" aria-hidden="true">{ this.state.count }</span>
				<span className="screen-reader-text">{ screenReader }</span>
			</span>
		);

		return createPortal(
			markup,
			document.querySelector( '#toplevel_page_googlesitekit-dashboard .wp-menu-name' )
		);
	}
}

export default NotificationCounter;
