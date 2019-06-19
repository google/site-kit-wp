<?php
/**
 * Class Google\Site_Kit\Core\Authentication\Sensitive_Scopes_Warning
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Authentication;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Admin\Screens;

/**
 * Class representing the warning about sensitive OAuth scopes.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Sensitive_Scopes_Warning {

	const QUERY_PARAMETER = 'googlesitekit_requesting_sensitive_scopes';
	const ACKNOWLEDGED    = 'acknowledged';

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * URL to the OAuth flow.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	private $connect_url;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context $context     Plugin context.
	 * @param string  $connect_url URL to the OAuth flow.
	 */
	public function __construct( Context $context, $connect_url ) {
		$this->context     = $context;
		$this->connect_url = $connect_url;
	}

	/**
	 * Gets the URL to the warning.
	 *
	 * @since 1.0.0
	 *
	 * @return string Warning page URL.
	 */
	public function get_url() {
		return add_query_arg(
			array(
				'page'                => Screens::PREFIX . 'splash',
				self::QUERY_PARAMETER => '1',
			),
			admin_url( 'admin.php' )
		);
	}

	/**
	 * Checks whether the warning about sensitive OAuth scopes should display.
	 *
	 * @since 1.0.0
	 *
	 * @param array $scopes List of currently requested scopes.
	 * @return bool True if the warning should display, false otherwise.
	 */
	public function should_display( array $scopes ) {
		if ( filter_input( INPUT_GET, self::ACKNOWLEDGED ) ) {
			return false;
		}

		$sensitive_scopes = array_filter( $scopes, array( $this, 'is_sensitive_scope' ) );
		return ! empty( $sensitive_scopes );
	}

	/**
	 * Renders the warning.
	 *
	 * @since 1.0.0
	 */
	public function render() {
		$assets_url = $this->context->url( 'dist/assets/' );

		$back_url = wp_get_referer();
		if ( ! $back_url ) {
			if ( current_user_can( Permissions::VIEW_DASHBOARD ) ) {
				$back_url = add_query_arg( 'page', Screens::PREFIX . 'dashboard', admin_url( 'admin.php' ) );
			} else {
				$back_url = add_query_arg( 'page', Screens::PREFIX . 'splash', admin_url( 'admin.php' ) );
			}
		}

		?>
		<div class="googlesitekit-plugin">
			<div class="googlesitekit-module-page">
				<div class="mdc-layout-grid">
					<div class="googlesitekit-layout">
						<div class="mdc-layout-grid">
							<h1>
								<?php esc_html_e( 'Unverified App Screen', 'google-site-kit' ); ?>
							</h1>
							<p>
								<?php
								echo wp_kses(
									__( 'After clicking the "Proceed" button below, you might see a <strong>warning screen</strong> that your website app is not yet verified.', 'google-site-kit' ),
									array(
										'strong' => array(),
									)
								);
								?>
							</p>
							<section>
								<p>
									<?php
									echo wp_kses(
										__( 'This <strong>does not stop</strong> you from using Site Kit. To continue the authentication process from this screen:', 'google-site-kit' ),
										array(
											'strong' => array(),
										)
									);
									?>
								</p>
								<ol>
									<li>
										<?php esc_html_e( 'Click on "Advanced" which will open a section below', 'google-site-kit' ); ?>
									</li>
									<li>
										<?php esc_html_e( 'Click on "Go to {YOUR DOMAIN} (unsafe)"', 'google-site-kit' ); ?>
									</li>
									<li>
										<?php esc_html_e( 'Proceed with approving the necessary API scopes as usual', 'google-site-kit' ); ?>
									</li>
								</ol>
								<p>
									<?php
									echo wp_kses(
										sprintf(
											/* translators: %s: external URL to learn more */
											__( 'For more information about app verification, <a href="%s" target="_blank">read the docs</a> on the Site Kit website.', 'google-site-kit' ),
											esc_url( 'https://sitekit.withgoogle.com/documentation/gcp-app-verification/' )
										),
										array(
											'a' => array(
												'href'   => array(),
												'target' => array(),
											),
										)
									);
									?>
								</p>
							</section>
							<footer>
								<p>
									<a href="<?php echo esc_url( add_query_arg( self::ACKNOWLEDGED, '1', $this->connect_url ) ); ?>" class="mdc-button mdc-button--raised mdc-dialog__button">
										<?php esc_html_e( 'Proceed', 'google-site-kit' ); ?>
									</a>
									<a href="<?php echo esc_url( $back_url ); ?>" class="googlesitekit-cta-link mdc-dialog__button">
										<?php esc_html_e( 'Cancel', 'google-site-kit' ); ?>
									</a>
								</p>
							</footer>
						</div>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Checks whether the given scope is considered sensitive.
	 *
	 * @since 1.0.0
	 *
	 * @param string $scope Google OAuth scope. Must include the 'https:/www.googleapis.com/auth/' prefix.
	 * @return bool True if the scope is considered sensitive, false otherwise.
	 */
	private function is_sensitive_scope( $scope ) {
		// For now these scope namespaces cover everything potentially relevant.
		$sensitive_namespaces = implode(
			'|',
			array_map(
				'preg_quote',
				array(
					'service.management',
					'cloud-platform',
					'contacts',
					'analytics',
					'tagmanager',
				)
			)
		);

		return (bool) preg_match( "/^https:\/\/www\.googleapis\.com\/auth\/($sensitive_namespaces)/", $scope );
	}
}
