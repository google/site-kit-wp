<?php
/**
 * Class Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager\SettingsTest
 *
 * @package   Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules\Reader_Revenue_Manager;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Reader_Revenue_Manager\Settings;
use Google\Site_Kit\Tests\Modules\SettingsTestCase;

/**
 * @group Modules
 * @group RRM
 */
class SettingsTest extends SettingsTestCase {
	/**
	 * Settings object.
	 *
	 * @var Settings
	 */
	private $settings;

	/**
	 * Options instance.
	 *
	 * @var Options
	 */
	private $options;

	/**
	 * Admin ID.
	 *
	 * @var int
	 */
	private $user_id;

	public function set_up() {
		parent::set_up();

		$this->options  = new Options( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$this->settings = new Settings( $this->options );
		$this->user_id  = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		wp_set_current_user( $this->user_id );
	}

	public function test_get_default() {
		$this->enable_feature( 'rrmModuleV2' );

		$this->settings->register();

		$this->assertEqualSetsWithIndex(
			array(
				'ownerID'                           => 0,
				'publicationID'                     => '',
				'publicationOnboardingState'        => '',
				'publicationOnboardingStateChanged' => false,
				'snippetMode'                       => 'post_types',
				'postTypes'                         => array( 'post' ),
				'productID'                         => 'openaccess',
				'productIDs'                        => array(),
				'paymentOption'                     => '',
			),
			get_option( Settings::OPTION )
		);
	}

	public function test_view_only_keys() {
		$this->assertIsArray( $this->settings->get_view_only_keys() );
		$this->assertEmpty( $this->settings->get_view_only_keys() );
	}

	public function data_revenue_manager_settings() {
		return array(
			'publicationID is valid string'                => array( 'publicationID', 'ABCD_123-4', 'ABCD_123-4' ),
			'publicationOnboardingState is valid string'   => array( 'publicationOnboardingState', 'PENDING_VERIFICATION', 'PENDING_VERIFICATION' ),
			'publicationOnboardingStateChanged is valid'   => array( 'publicationOnboardingStateChanged', true, true ),
			'publicationID is invalid string'              => array( 'publicationID', 'ABCD_123-4&^##', '' ),
			'publicationOnboardingState is invalid string' => array( 'publicationOnboardingState', 'INVALID_STATE', '' ),
			'publicationOnboardingStateChanged is invalid' => array( 'publicationOnboardingStateChanged', 'invalid', false ),

			// Validate snippetMode.
			'snippetMode with post_types'                  => array( 'snippetMode', 'post_types', 'post_types' ),
			'snippetMode with per_post'                    => array( 'snippetMode', 'per_post', 'per_post' ),
			'snippetMode with sitewide'                    => array( 'snippetMode', 'sitewide', 'sitewide' ),
			'snippetMode with invalid value'               => array( 'snippetMode', 'invalid-mode', 'post_types' ),
			'snippetMode with invalid type'                => array( 'snippetMode', array(), 'post_types' ),

			// Validate postTypes.
			'postTypes with valid strings'                 => array( 'postTypes', array( 'post', 'page' ), array( 'post', 'page' ) ),
			'postTypes with empty array'                   => array( 'postTypes', array(), array( 'post' ) ),
			'postTypes with invalid type'                  => array( 'postTypes', 'not-an-array', array( 'post' ) ),
			'postTypes with mixed types'                   => array( 'postTypes', array( 'post', 123, true, 'page' ), array( 'post', 'page' ) ),
			'postTypes with all invalid'                   => array( 'postTypes', array( 123, true, array() ), array( 'post' ) ),

			// Validate productID.
			'productID with valid string'                  => array( 'productID', 'premium', 'premium' ),
			'productID with empty string'                  => array( 'productID', '', '' ),
			'productID with invalid type'                  => array( 'productID', array(), 'openaccess' ),
			'productID with number'                        => array( 'productID', 123, 'openaccess' ),
			'productID with boolean'                       => array( 'productID', true, 'openaccess' ),

			// Validate productIDs.
			'productIDs with valid strings'                => array( 'productIDs', array( 'basic', 'premium' ), array( 'basic', 'premium' ) ),
			'productIDs with empty array'                  => array( 'productIDs', array(), array() ),
			'productIDs with invalid type'                 => array( 'productIDs', 'not-an-array', array() ),
			'productIDs with mixed types'                  => array( 'productIDs', array( 'valid', 123, true, 'also-valid' ), array( 'valid', 'also-valid' ) ),
			'productIDs with all invalid'                  => array( 'productIDs', array( 123, true, array() ), array() ),

			// Validate paymentOption.
			'paymentOption with valid string'              => array( 'paymentOption', 'some-option', 'some-option' ),
			'paymentOption with empty string'              => array( 'paymentOption', '', '' ),
			'paymentOption with invalid type'              => array( 'paymentOption', array(), '' ),
			'paymentOption with number'                    => array( 'paymentOption', 123, '' ),
			'paymentOption with boolean'                   => array( 'paymentOption', true, '' ),
		);
	}

	/**
	 * @dataProvider data_revenue_manager_settings
	 */
	public function test_reader_revenue_manager_settings_sanitization( $setting, $value, $expected_value ) {
		$this->enable_feature( 'rrmModuleV2' );
		$this->settings->register();

		$options_key = $this->get_option_name();
		delete_option( $options_key );

		$options             = $this->settings->get();
		$options[ $setting ] = $value;
		$this->settings->set( $options );
		$options = get_option( $options_key );
		$this->assertEquals( $expected_value, $options[ $setting ] );
	}

	/**
	 * @inheritDoc
	 */
	protected function get_option_name() {
		return Settings::OPTION;
	}
}
