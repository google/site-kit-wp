/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import SvgIcon from 'GoogleUtil/svg-icon';

storiesOf( 'WordPress', module )
	.add( 'WordPress Activation', () => {
		return (
			<div className="notice notice-success is-dismissible">
				<div className="googlesitekit-activation">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-grid__inner">
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-12
							">
								<div className="googlesitekit-activation__logo">
									<SvgIcon id="logo-g" height="33" width="33" />
								</div>
								<h3 className="googlesitekit-heading-3 googlesitekit-activation__title">{ __( 'Congratulations, the Site Kit plugin is now activated.', 'google-site-kit' ) }</h3>
								<a className="googlesitekit-activation__button mdc-button mdc-button--raised" href="#start-setup">
									{ __( 'Start Setup', 'google-site-kit' ) }
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	} );
