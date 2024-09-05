<?php
/**
 * Class Google\Site_Kit\Core\Util\Activation_Flag
 *
 * @package   Google\Site_Kit
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class handling plugin activation.
 *
 * @since 1.10.0
 * @access private
 * @ignore
 */
final class Activation_Flag {
	const OPTION_SHOW_ACTIVATION_NOTICE = 'googlesitekit_show_activation_notice';
	const OPTION_NEW_SITE_POSTS         = 'googlesitekit_new_site_posts';

	/**
	 * Plugin context.
	 *
	 * @since 1.10.0
	 * @var Context
	 */
	private $context;

	/**
	 * Option API instance.
	 *
	 * @since 1.10.0
	 * @var Options
	 */
	protected $options;

	/**
	 * Constructor.
	 *
	 * @since 1.10.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. The Option API instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null
	) {
		$this->context = $context;
		$this->options = $options ?: new Options( $this->context );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.10.0
	 */
	public function register() {
		add_action(
			'googlesitekit_activation',
			function ( $network_wide ) {
				// Set activation flag.
				$this->set_activation_flag( $network_wide );
			}
		);

		add_filter(
			'googlesitekit_admin_data',
			function ( $data ) {
				return $this->inline_js_admin_data( $data );
			}
		);
	}

	/**
	 * Sets the flag that the plugin has just been activated.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param bool $network_wide Whether the plugin is being activated network-wide.
	 */
	public function set_activation_flag( $network_wide ) {
		if ( $network_wide ) {
			update_network_option( null, self::OPTION_SHOW_ACTIVATION_NOTICE, '1' );
			return;
		}

		update_option( self::OPTION_SHOW_ACTIVATION_NOTICE, '1', false );
	}

	/**
	 * Gets the flag that the plugin has just been activated.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param bool $network_wide Whether to check the flag network-wide.
	 * @return bool True if just activated, false otherwise.
	 */
	public function get_activation_flag( $network_wide ) {
		if ( $network_wide ) {
			return (bool) get_network_option( null, self::OPTION_SHOW_ACTIVATION_NOTICE );
		}

		return (bool) get_option( self::OPTION_SHOW_ACTIVATION_NOTICE );
	}

	/**
	 * Deletes the flag that the plugin has just been activated.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param bool $network_wide Whether the plugin is being activated network-wide.
	 */
	public function delete_activation_flag( $network_wide ) {
		if ( $network_wide ) {
			delete_network_option( null, self::OPTION_SHOW_ACTIVATION_NOTICE );
			return;
		}

		delete_option( self::OPTION_SHOW_ACTIVATION_NOTICE );
	}


	/**
	 * Modifies the admin data to pass to JS.
	 *
	 * @since 1.10.0 Migrated from Activation class.
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_admin_data( $data ) {
		$data['newSitePosts'] = $this->options->get( self::OPTION_NEW_SITE_POSTS );

		return $data;
	}
}
