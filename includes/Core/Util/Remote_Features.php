<?php
/**
 * Class Google\Site_Kit\Core\Util\Remote_Features
 *
 * @package   Google\Site_Kit
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\Google_Proxy;
use Google\Site_Kit\Core\Storage\Options;
use WP_Error;

/**
 * Class handling the fetching of Site Kit's currently
 * enabled features remotely via the Site Kit service.
 *
 * @since 1.118.0
 * @access private
 * @ignore
 */
final class Remote_Features {

	use Method_Proxy_Trait;

	/**
	 * Option key in options table to store remote features.
	 */
	const OPTION = 'googlesitekitpersistent_remote_features';

	/**
	 * Options instance.
	 *
	 * @since 1.118.0
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.118.0
	 *
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * OAuth credentials instance.
	 *
	 * @since 1.118.0
	 *
	 * @var Credentials
	 */
	private $credentials;

	/**
	 * Google_Proxy instance.
	 *
	 * @since 1.118.0
	 *
	 * @var Google_Proxy
	 */
	protected $google_proxy;

	/**
	 * Constructor.
	 *
	 * @since 1.118.0
	 *
	 * @param Options        $options        Options instance.
	 * @param Authentication $authentication Authentication instance.
	 */
	public function __construct( Options $options, Authentication $authentication ) {
		$this->options        = $options;
		$this->authentication = $authentication;
		$this->credentials    = $authentication->credentials();
		$this->google_proxy   = $authentication->get_google_proxy();
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since 1.118.0
	 */
	public function register() {
		add_filter( 'googlesitekit_is_feature_enabled', $this->get_method_proxy( 'filter_features' ), 10, 2 );

		add_action( 'googlesitekit_cron_update_remote_features', $this->get_method_proxy( 'cron_update_remote_features' ) );
		if ( ! wp_next_scheduled( 'googlesitekit_cron_update_remote_features' ) && ! wp_installing() ) {
			wp_schedule_event( time(), 'twicedaily', 'googlesitekit_cron_update_remote_features' );
		}
	}

	/**
	 * Filters feature flags using features stored in options.
	 *
	 * @since 1.118.0
	 *
	 * @param boolean $feature_enabled Original value of the feature.
	 * @param string  $feature_name    Feature name.
	 * @return boolean State flag from options if it is available, otherwise the original value.
	 */
	private function filter_features( $feature_enabled, $feature_name ) {
		$features = $this->options->get( self::OPTION );

		if ( isset( $features[ $feature_name ]['enabled'] ) ) {
			return filter_var( $features[ $feature_name ]['enabled'], FILTER_VALIDATE_BOOLEAN );
		}

		return $feature_enabled;
	}

	/**
	 * Fetches remotely-controlled features from the Google Proxy server and
	 * saves them in a persistent option.
	 *
	 * If the fetch errors or fails, the persistent option is not updated.
	 *
	 * @since 1.71.0
	 * @since 1.118.0 Moved here from the Authentication class.
	 *
	 * @return array|WP_Error Array of features or a WP_Error object if the fetch errored.
	 */
	public function fetch_remote_features() {
		$remote_features_option = self::OPTION;
		$features               = $this->google_proxy->get_features( $this->credentials );
		if ( ! is_wp_error( $features ) && is_array( $features ) ) {
			$this->options->set( $remote_features_option, $features );
		}

		return $features;
	}

	/**
	 * Action that is run by a cron twice daily to fetch and cache remotely-enabled features
	 * from the Google Proxy server, if Site Kit has been setup.
	 *
	 * @since 1.71.0
	 * @since 1.118.0 Moved here from the Authentication class.
	 *
	 * @return void
	 */
	private function cron_update_remote_features() {
		if ( ! $this->credentials->has() || ! $this->credentials->using_proxy() ) {
			return;
		}
		$this->fetch_remote_features();
	}
}
