<?php
/**
 * Class Google\Site_Kit\Core\Util\Debug_Data
 *
 * @package   Google\Site_Kit\Core\Util
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Util;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Authentication\Clients\OAuth_Client;
use Google\Site_Kit\Core\Modules\Module;
use Google\Site_Kit\Core\Modules\Module_With_Debug_Fields;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Util\Feature_Flags;

/**
 * Class for integrating debug information with Site Health.
 *
 * @since 1.5.0
 * @access private
 * @ignore
 */
class Debug_Data {
	/**
	 * Context instance.
	 *
	 * @since 1.5.0
	 * @var Context
	 */
	private $context;

	/**
	 * Options instance.
	 *
	 * @since 1.5.0
	 * @var Options
	 */
	private $options;

	/**
	 * User_Options instance.
	 *
	 * @since 1.5.0
	 * @var User_Options
	 */
	private $user_options;

	/**
	 * Authentication instance.
	 *
	 * @since 1.5.0
	 * @var Authentication
	 */
	private $authentication;

	/**
	 * Modules instance.
	 *
	 * @since 1.5.0
	 * @var Modules
	 */
	private $modules;

	/**
	 * Constructor.
	 *
	 * @since 1.5.0
	 *
	 * @param Context        $context        Context instance.
	 * @param Options        $options        Optional. Options instance. Default is a new instance.
	 * @param User_Options   $user_options   Optional. User_Options instance. Default is a new instance.
	 * @param Authentication $authentication Optional. Authentication instance. Default is a new instance.
	 * @param Modules        $modules        Optional. Modules instance. Default is a new instance.
	 */
	public function __construct(
		Context $context,
		Options $options = null,
		User_Options $user_options = null,
		Authentication $authentication = null,
		Modules $modules = null
	) {
		$this->context        = $context;
		$this->options        = $options ?: new Options( $this->context );
		$this->user_options   = $user_options ?: new User_Options( $this->context );
		$this->authentication = $authentication ?: new Authentication( $this->context, $this->options, $this->user_options );
		$this->modules        = $modules ?: new Modules( $this->context, $this->options, $this->user_options, $this->authentication );
	}

	/**
	 * Registers debug information with Site Health.
	 *
	 * @since 1.5.0
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
	 * @since 1.5.0
	 *
	 * @param string $string     Input string to redact.
	 * @param int    $mask_start Starting position of redaction and length of preserved characters.
	 *                             If positive, characters are redacted from the end, preserving the first X characters.
	 *                             If negative, characters are redacted from the beginning preserving the last X characters.
	 * @return string
	 */
	public static function redact_debug_value( $string, $mask_start = 4 ) {
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
	 * @since 1.5.0
	 *
	 * @return array
	 */
	protected function get_fields() {
		$fields = array(
			'version'              => array(
				'label' => __( 'Version', 'google-site-kit' ),
				'value' => GOOGLESITEKIT_VERSION,
			),
			'php_version'          => array(
				'label' => __( 'PHP Version', 'google-site-kit' ),
				'value' => PHP_VERSION,
			),
			'wp_version'           => array(
				'label' => __( 'WordPress Version', 'google-site-kit' ),
				'value' => get_bloginfo( 'version' ),
			),
			'reference_url'        => array(
				'label' => __( 'Reference Site URL', 'google-site-kit' ),
				'value' => $this->context->get_reference_site_url(),
			),
			'amp_mode'             => $this->get_amp_mode_field(),
			'site_status'          => $this->get_site_status_field(),
			'user_status'          => $this->get_user_status_field(),
			'connected_user_count' => $this->get_connected_user_count_field(),
			'active_modules'       => $this->get_active_modules_field(),
			'required_scopes'      => $this->get_required_scopes_field(),
			'capabilities'         => $this->get_capabilities_field(),
			'enabled_features'     => $this->get_feature_fields(),
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
	 * @since 1.5.0
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
			'debug' => isset( $mode_map[ $mode ] ) ? $mode : 'no',
		);
	}

	/**
	 * Gets the field definition for the site_status field.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_site_status_field() {
		$is_connected = $this->authentication->credentials()->has();
		$using_proxy  = $this->authentication->credentials()->using_proxy();
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
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_user_status_field() {
		$is_connected = $this->authentication->is_authenticated();

		return array(
			'label' => __( 'User Status', 'google-site-kit' ),
			'value' => $is_connected
				? __( 'Authenticated', 'google-site-kit' )
				: __( 'Not authenticated', 'google-site-kit' ),
			'debug' => $is_connected ? 'authenticated' : 'not authenticated',
		);
	}

	/**
	 * Gets the number of users with a Site Kit token.
	 *
	 * @since 1.16.0
	 *
	 * @return array
	 */
	private function get_connected_user_count_field() {
		$users = new \WP_User_Query(
			array(
				// phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_key' => $this->user_options->get_meta_key( OAuth_Client::OPTION_ACCESS_TOKEN ),
				'fields'   => 'ID',
				'compare'  => 'EXISTS',
			)
		);
		return array(
			'label' => __( 'Connected user count', 'google-site-kit' ),
			'value' => $users->get_total(),
		);
	}

	/**
	 * Gets the field definition for the active_modules field.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_active_modules_field() {
		$active_modules = $this->modules->get_active_modules();

		return array(
			'label' => __( 'Active Modules', 'google-site-kit' ),
			'value' => join(
				/* translators: used between list items, there is a space after the comma. */
				__( ', ', 'google-site-kit' ),
				wp_list_pluck( $active_modules, 'name' )
			),
			'debug' => join( ', ', wp_list_pluck( $active_modules, 'slug' ) ),
		);
	}

	/**
	 * Gets the field definition for the required_scopes field.
	 *
	 * @since 1.5.0
	 *
	 * @return array
	 */
	private function get_required_scopes_field() {
		$required_scopes = $this->authentication->get_oauth_client()->get_required_scopes();
		$granted_scopes  = $this->authentication->get_oauth_client()->get_granted_scopes();
		$value           = array();

		foreach ( $required_scopes as $scope ) {
			$satisfied       = Scopes::is_satisfied_by( $scope, $granted_scopes );
			$value[ $scope ] = $satisfied ? '✅' : '⭕';
		}

		return array(
			'label' => __( 'Required scopes', 'google-site-kit' ),
			'value' => $value,
		);
	}

	/**
	 * Gets capabilities for the current user.
	 *
	 * @since 1.21.0
	 *
	 * @return array
	 */
	private function get_capabilities_field() {
		$permissions = new Permissions( $this->context, $this->authentication );
		$value       = array();

		foreach ( $permissions->check_all_for_current_user() as $permission => $granted ) {
			$value[ $permission ] = $granted ? '✅' : '⭕';
		}

		return array(
			'label' => __( 'User Capabilities', 'google-site-kit' ),
			'value' => $value,
		);
	}

	/**
	 * Gets field definitions for each active module that supports debug fields.
	 *
	 * @since 1.5.0
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

	/**
	 * Gets the available features.
	 *
	 * @since 1.26.0
	 *
	 * @return array
	 */
	private function get_feature_fields() {
		$value              = array();
		$available_features = Feature_Flags::get_available_features();

		foreach ( $available_features as $available_feature ) {
			$enabled_feature             = Feature_Flags::enabled( $available_feature );
			$value[ $available_feature ] = $enabled_feature ? '✅' : '⭕';
		}

		return array(
			'label' => __( 'Features', 'google-site-kit' ),
			'value' => $value,
		);
	}
}
