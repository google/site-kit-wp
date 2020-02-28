<?php
/**
 * Class Google\Site_Kit\Core\Util\Debug_Data
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2020 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Authentication\Credentials;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Encrypted_Options;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;

/**
 * Class for integrating debug information with Site Health.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Debug_Data {
	/**
	 * Context instance.
	 *
	 * @since n.e.x.t
	 * @var Context
	 */
	private $context;

	/**
	 * Modules instance.
	 *
	 * @since n.e.x.t
	 * @var Modules
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Context instance.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
		$this->modules = new Modules( $context );
	}

	/**
	 * Registers debug information with Site Health.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		add_filter(
			'debug_information',
			function ( $info ) {
				$info['google-site-kit'] = array(
					'label'  => __( 'Site Kit by Google', 'google-site-kit' ),
					'fields' => $this->get_fields(),
				);

				return $info;
			}
		);
	}

	/**
	 * Redacts the given string by overwriting a portion with a mask character.
	 *
	 * @since n.e.x.t
	 *
	 * @param string $string     Input string to redact.
	 * @param int    $mask_start Starting position of redaction and length of preserved characters.
	 *                             If negative, characters are redacted from the beginning preserving the last X characters.
	 *                             If positive, characters are redacted from the end, preserving the first X characters.
	 * @return string
	 */
	public static function redact_debug_value( $string, $mask_start = -4 ) {
		if ( ! is_scalar( $string ) ) {
			return '';
		}

		$string = (string) $string;
		if ( $mask_start < 0 ) {
			$redacted = substr( $string, 0, $mask_start );
			$unmasked = substr( $string, $mask_start );
			return str_repeat( '•', strlen( $redacted ) ) . $unmasked;
		} else {
			$redacted = substr( $string, $mask_start );
			$unmasked = substr( $string, 0, $mask_start );
			return $unmasked . str_repeat( '•', strlen( $redacted ) );
		}
	}

	/**
	 * Gets all fields.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	protected function get_fields() {
		$fields = array(
			'version'        => array(
				'label' => __( 'Version', 'google-site-kit' ),
				'value' => GOOGLESITEKIT_VERSION,
			),
			'php_version'    => array(
				'label' => __( 'PHP Version', 'google-site-kit' ),
				'value' => PHP_VERSION,
			),
			'wp_version'     => array(
				'label' => __( 'WordPress Version', 'google-site-kit' ),
				'value' => get_bloginfo( 'version' ),
			),
			'reference_url'  => array(
				'label' => __( 'Reference Site URL', 'google-site-kit' ),
				'value' => $this->context->get_reference_site_url(),
			),
			'amp_mode'       => $this->get_amp_mode_field(),
			'site_status'    => $this->get_site_status_field(),
			'user_status'    => $this->get_user_status_field(),
			'active_modules' => $this->get_active_modules_field(),
		);
		$none   = __( 'None', 'google-site-kit' );

		return array_map(
			function ( $field ) use ( $none ) {
				if ( empty( $field['value'] ) ) {
					$field['value'] = $none;
					$field['debug'] = 'none';
				}

				return $field;
			},
			array_merge( $fields, $this->get_module_fields() )
		);
	}

	/**
	 * Gets the field definition for the amp_mode field.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	private function get_amp_mode_field() {
		$mode     = $this->context->get_amp_mode();
		$mode_map = array(
			'primary'   => __( 'Primary', 'google-site-kit' ),
			'secondary' => __( 'Secondary', 'google-site-kit' ),
		);

		return array(
			'label' => __( 'AMP Mode', 'google-site-kit' ),
			'value' => isset( $mode_map[ $mode ] ) ? $mode_map[ $mode ] : __( 'No', 'google-site-kit' ),
			'debug' => $mode,
		);
	}

	/**
	 * Gets the field definition for the site_status field.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	private function get_site_status_field() {
		$credentials  = new Credentials( new Encrypted_Options( new Options( $this->context ) ) );
		$is_connected = $credentials->has();
		$using_proxy  = ( new Authentication( $this->context ) )->get_oauth_client()->using_proxy();
		$status_map   = array(
			'connected-site'  => __( 'Connected through site credentials', 'google-site-kit' ),
			'connected-oauth' => __( 'Connected through OAuth client credentials', 'google-site-kit' ),
			'not-connected'   => __( 'Not connected', 'google-site-kit' ),
		);

		if ( $is_connected && $using_proxy ) {
			$status = 'connected-site';
		} elseif ( $is_connected && ! $using_proxy ) {
			$status = 'connected-oauth';
		} else {
			$status = 'not-connected';
		}

		return array(
			'label' => __( 'Site Status', 'google-site-kit' ),
			'value' => $status_map[ $status ],
			'debug' => $status,
		);
	}

	/**
	 * Gets the field definition for the user_status field.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	private function get_user_status_field() {
		$user_options      = new User_Options( $this->context );
		$has_auth_token    = (bool) $user_options->get( OAuth_Client::OPTION_ACCESS_TOKEN );
		$has_refresh_token = (bool) $user_options->get( OAuth_Client::OPTION_REFRESH_TOKEN );
		$is_connected      = $has_auth_token && $has_refresh_token;

		return array(
			'label' => __( 'User Status', 'google-site-kit' ),
			'value' => $is_connected
				? __( 'Authenticated', 'google-site-kit' )
				: __( 'Not authenticated', 'google-site-kit' ),
			'debug' => $is_connected ? 'authenticated' : 'not authenticated',
		);
	}

	/**
	 * Gets the field definition for the active_modules field.
	 *
	 * @since n.e.x.t
	 *
	 * @return array
	 */
	private function get_active_modules_field() {
		$module_slugs = wp_list_pluck( $this->modules->get_active_modules(), 'slug' );

		return array(
			'label' => __( 'Active Modules', 'google-site-kit' ),
			'value' => join(
				/* translators: used between list items, there is a space after the comma. */
				__( ', ', 'google-site-kit' ),
				$module_slugs
			),
			'debug' => join( ', ', $module_slugs ),
		);
	}

	/**
	 * Gets field definitions for each active module that supports debug fields.
	 *
	 * @since n.e.x.t
	 *
	 * @return array A flat array of all module debug fields.
	 */
	private function get_module_fields() {
		$modules_with_debug_fields = array_filter(
			$this->modules->get_active_modules(),
			function ( Module $module ) {
				return $module instanceof Module_With_Debug_Fields;
			}
		);

		$fields_by_module = array_map(
			function ( Module_With_Debug_Fields $module ) {
				return $module->get_debug_fields();
			},
			array_values( $modules_with_debug_fields )
		);

		return array_merge( array(), ...$fields_by_module );
	}
}
