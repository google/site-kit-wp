/**
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Notification from 'GoogleComponents/notifications/notification';
import PageHeader from 'GoogleComponents/page-header';

class ErrorHandler extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			error: null,
			info: null,
		};
	}

	componentDidCatch( error, info ) {
		this.setState( { error, info } );
	}

	render() {
		const { children } = this.props;
		const { error, info } = this.state;

		// If there is no caught error, render the children components normally.
		if ( ! error ) {
			return children;
		}

		window.console.error( 'Rendering error:', error, info );

		return (
			<div>
				<Notification
					id={ 'googlesitekit-error' }
					key={ 'googlesitekit-error' }
					title={ error }
					description={ info.componentStack }
					dismiss={ '' }
					isDismissable={ false }
					format="small"
					type="win-error"
				/>
				<div className="googlesitekit-module-page">
					<div className="googlesitekit-dashboard">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-10-desktop
									mdc-layout-grid__cell--span-6-tablet
									mdc-layout-grid__cell--span-2-phone
								">
									<PageHeader
										className="
											googlesitekit-heading-2
											googlesitekit-dashboard__heading
										"
										title={ __( 'Site Error', 'google-site-kit' ) }
									/>
								</div>
								<div className="
										mdc-layout-grid__cell
										mdc-layout-grid__cell--span-2-desktop
										mdc-layout-grid__cell--span-2-tablet
										mdc-layout-grid__cell--span-2-phone
										mdc-layout-grid__cell--align-middle
										mdc-layout-grid__cell--align-right
								">
								</div>
								ERROR: { error }
								INFO: { info }
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

ErrorHandler.defaultProps = {};

ErrorHandler.propTypes = {
	/** @ignore */
	children: PropTypes.node.isRequired,
};

export default ErrorHandler;
