<?php
/**
 * Class Google\Site_Kit\Core\Util\Reset
 *
 * @package   Google\Site_Kit
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\Transients;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Authentication\API_Key;
use Google\Site_Kit\Core\Authentication\First_Admin;
use Google\Site_Kit\Core\Authentication\Verification;
use Google\Site_Kit\Core\Authentication\Verification_Tag;
use Google\Site_Kit\Core\Authentication\Profile;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Util\Activation;
use Google\Site_Kit\Modules\Search_Console;
use Google\Site_Kit\Modules\AdSense;
use Google\Site_Kit\Modules\Analytics;
use Google\Site_Kit\Modules\PageSpeed_Insights;
use Google\Site_Kit\Modules\Optimize;
use Google\Site_Kit\Modules\TagManager;

/**
 * Class providing functions to reset the plugin.
 *
 * @since 1.0.0
 * @access private
 * @ignore
 */
final class Reset {

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options object.
	 *
	 * @since 1.0.0
	 * @var Options
	 */
	private $options;

	/**
	 * Transients object.
	 *
	 * @since 1.0.0
	 * @var Transients
	 */
	private $transients;

	/**
	 * Constructor.
	 *
	 * @since 1.0.0
	 *
	 * @param Context    $context Plugin context.
	 * @param Options    $options Optional. Options instance. Default is a new instance.
	 * @param Transients $transients Optional. Transients instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null, Transients $transients = null ) {
		$this->context = $context;

		if ( ! $options ) {
			$options = new Options( $this->context );
		}
		$this->options = $options;

		if ( ! $transients ) {
			$transients = new Transients( $this->context );
		}
		$this->transients = $transients;
	}

	/**
	 * Deletes options, user stored options, transients and clears object cache for stored options.
	 *
	 * @since 1.0.0
	 */
	public function all() {
		$this->delete_all_plugin_options();
		$this->delete_all_user_metas();
		$this->delete_all_transients();

		// Clear options cache.
		wp_cache_delete( 'alloptions', 'options' );
	}

	/**
	 * Deletes all the plugin options.
	 *
	 * @since 1.0.0
	 */
	private function delete_all_plugin_options() {
		// Deletes all options from the options table.
		$this->options->delete( Activation::OPTION_SHOW_ACTIVATION_NOTICE );
		$this->options->delete( Activation::OPTION_NEW_SITE_POSTS );
		$this->options->delete( Credentials::OPTION );
		$this->options->delete( API_Key::OPTION );
		$this->options->delete( 'googlesitekit-active-modules' );
		$this->options->delete( Search_Console::PROPERTY_OPTION );
		$this->options->delete( AdSense::OPTION );
		$this->options->delete( Analytics::OPTION );
		$this->options->delete( 'googlesitekit_analytics_adsense_linked' );
		$this->options->delete( PageSpeed_Insights::OPTION );
		$this->options->delete( Optimize::OPTION );
		$this->options->delete( TagManager::OPTION );
		$this->options->delete( First_Admin::OPTION );
		$this->options->delete( OAuth_Client::OPTION_PROXY_NONCE );

		// Clean up old site verification data, moved to user options.
		// Also clean up other old unused options.
		// @todo remove after RC.
		$this->options->delete( Verification::OPTION );
		$this->options->delete( Verification_Tag::OPTION );
		$this->options->delete( 'googlesitekit_available_modules' );
		$this->options->delete( 'googlesitekit_secret_token' );
		$this->options->delete( 'googlesitekit_project_id' );
		$this->options->delete( 'googlesitekit_gcp_project' );
	}

	/**
	 * Deletes all the user stored options in user meta.
	 *
	 * @since 1.0.0
	 */
	private function delete_all_user_metas() {
		global $wpdb;

		// User option keys are prefixed in single site and multisite when not in network mode.
		$key_prefix = $this->context->is_network_mode() ? '' : $wpdb->get_blog_prefix();
		$user_query = new \WP_User_Query(
			array(
				'fields'   => 'id',
				'meta_key' => $key_prefix . OAuth_Client::OPTION_ACCESS_TOKEN,
				'compare'  => 'EXISTS',
			)
		);

		$users = $user_query->get_results();

		foreach ( $users as $user_id ) {
			// Deletes all user stored options.
			$user_options = new User_Options( $this->context, $user_id );
			$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN );
			$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN_EXPIRES_IN );
			$user_options->delete( OAuth_Client::OPTION_ACCESS_TOKEN_CREATED );
			$user_options->delete( OAuth_Client::OPTION_REFRESH_TOKEN );
			$user_options->delete( OAuth_Client::OPTION_REDIRECT_URL );
			$user_options->delete( OAuth_Client::OPTION_AUTH_SCOPES );
			$user_options->delete( OAuth_Client::OPTION_ERROR_CODE );
			$user_options->delete( OAuth_Client::OPTION_PROXY_ACCESS_CODE );
			$user_options->delete( Verification::OPTION );
			$user_options->delete( Verification_Tag::OPTION );
			$user_options->delete( Profile::OPTION );

			// Clean up old user  api key data, moved to options.
			// @todo remove after RC.
			$user_options->delete( API_Key::OPTION );
			$user_options->delete( 'sitekit_authentication' );
			$user_options->delete( 'googlesitekit_stored_nonce_user_id' );
		}
	}

	/**
	 * Deletes all the stored transients.
	 *
	 * @since 1.0.0
	 */
	private function delete_all_transients() {
		$this->transients->delete( 'googlesitekit_verification_meta_tags' );
	}
}
