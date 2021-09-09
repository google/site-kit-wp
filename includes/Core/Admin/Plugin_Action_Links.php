<?php
/**
 * Class Google\Site_Kit\Core\Admin\Plugin_Action_Links
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Admin;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Permissions\Permissions;

/**
 * Class for managing plugin action links.
 *
 * @since 1.41.0
 * @access private
 * @ignore
 */
class Plugin_Action_Links {

	/**
	 * Plugin context.
	 *
	 * @since 1.41.0
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since 1.41.0
	 *
	 * @param Context $context      Plugin context.
	 */
	public function __construct(
		Context $context
	) {
		$this->context = $context;
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.41.0
	 */
	public function register() {
		add_filter(
			'plugin_action_links_' . GOOGLESITEKIT_PLUGIN_BASENAME,
			function ( $links ) {

				if ( current_user_can( Permissions::MANAGE_OPTIONS ) ) {

					$settings_link = sprintf(
						'<a href="%s">%s</a>',
						esc_url( $this->context->admin_url( 'settings' ) ),
						esc_html__( 'Settings', 'google-site-kit' )
					);

					array_unshift( $links, $settings_link );
				};

				return $links;
			}
		);
	}

}
