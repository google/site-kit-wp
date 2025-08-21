<?php
/**
 * Class Google\Site_Kit\Tests\Tags\GTagTest
 *
 * @package   Google\Site_Kit\Tests\Core\Tags\GTag
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Tags;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Core\Tags\GTag;
use Google\Site_Kit\Tests\TestCase;

class GTagTest extends TestCase {

	/**
	 * Holds an instance of the GTag class.
	 *
	 * @var GTag $gtag Gtag instance.
	 */
	private $gtag;

	const TEST_TAG_ID_1           = 'GT-12345';
	const TEST_TAG_ID_2           = 'GT-67890';
	const TEST_TAG_ID_2_CONFIG    = array( 'foo' => 'bar' );
	const TEST_COMMAND_1          = 'foo';
	const TEST_COMMAND_1_POSITION = 'before';
	const TEST_COMMAND_1_PARAMS   = array( 'bar', 'far' );
	const TEST_COMMAND_2_POSITION = 'after';
	const TEST_COMMAND_2          = 'foo';
	const TEST_COMMAND_2_PARAMS   = array( array( 'bar' => 'far' ) );

	/**
	 * Options object.
	 *
	 * @var Options
	 */
	private $options;

	public function set_up() {
		parent::set_up();

		$context       = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->options = new Options( $context );
		$this->gtag    = new GTag( $this->options );
		$this->gtag->register();

		$this->gtag->add_tag( static::TEST_TAG_ID_1 );

		// Add commands for testing.
		$this->gtag->add_command( static::TEST_COMMAND_1, static::TEST_COMMAND_1_PARAMS, static::TEST_COMMAND_1_POSITION );
		$this->gtag->add_command( static::TEST_COMMAND_2, static::TEST_COMMAND_2_PARAMS, static::TEST_COMMAND_2_POSITION );
	}

	public function test_gtag_class_instance() {
		$this->assertInstanceOf( GTag::class, $this->gtag, 'GTag instance should be created.' );
	}

	public function test_gtag_script_enqueue() {
		$this->assertFalse( wp_script_is( GTag::HANDLE ), 'GTag script should not be enqueued before wp_enqueue_scripts.' );

		do_action( 'wp_enqueue_scripts' );

		// Assert that the gtag script is enqueued.
		$this->assertTrue( wp_script_is( GTag::HANDLE ), 'GTag script should be enqueued after wp_enqueue_scripts.' );
	}

	public function test_gtag_script_src() {
		do_action( 'wp_enqueue_scripts' );

		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert that the gtag script src is correct.
		$this->assertEquals( 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_1, $script->src, 'GTag script src should match expected URL.' );
	}

	public function test_gtag_script_contains_gtag_call() {
		do_action( 'wp_enqueue_scripts' );

		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert the array of inline script data contains the necessary gtag config line.
		// Should be in index 5, the first registered gtag.
		$this->assertEquals( 'gtag("config", "' . static::TEST_TAG_ID_1 . '");', $script->extra['after'][5], 'Inline script should include config call for first tag.' );
	}

	/**
	 * @dataProvider provider_google_tag_gateway_data
	 */
	public function test_gtag_script_src__google_tag_gateway( $data ) {
		self::enable_feature( 'googleTagGateway' );

		$google_tag_gateway_settings = new Google_Tag_Gateway_Settings( $this->options );
		$google_tag_gateway_settings->set( $data['settings'] );

		do_action( 'wp_enqueue_scripts' );
		$registered_srcs = wp_list_pluck( wp_scripts()->registered, 'src' );

		$this->assertContains( $data['expected_src'], $registered_srcs, 'Registered script src should match expected for GTG conditions.' );
	}

	public function provider_google_tag_gateway_data() {
		$googletagmanager_url = 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_1;

		return array(
			'all settings enabled'        => array(
				array(
					'settings'     => array(
						'isEnabled'             => true,
						'isGTGHealthy'          => true,
						'isScriptAccessEnabled' => true,
					),
					'expected_src' => plugins_url( 'gtg/measurement.php', GOOGLESITEKIT_PLUGIN_MAIN_FILE ) . '?id=' . static::TEST_TAG_ID_1 . '&#038;s=/gtag/js',
				),
			),
			'isEnabled false'             => array(
				array(
					'settings'     => array(
						'isEnabled'             => false,
						'isGTGHealthy'          => true,
						'isScriptAccessEnabled' => true,
					),
					'expected_src' => $googletagmanager_url,
				),
			),
			'isGTGHealthy false'          => array(
				array(
					'settings'     => array(
						'isEnabled'             => true,
						'isGTGHealthy'          => false,
						'isScriptAccessEnabled' => true,
					),
					'expected_src' => $googletagmanager_url,
				),
			),
			'isScriptAccessEnabled false' => array(
				array(
					'settings'     => array(
						'isEnabled'             => true,
						'isGTGHealthy'          => true,
						'isScriptAccessEnabled' => false,
					),
					'expected_src' => $googletagmanager_url,
				),
			),
			'all settings disabled'       => array(
				array(
					'settings'     => array(
						'isEnabled'             => false,
						'isGTGHealthy'          => false,
						'isScriptAccessEnabled' => false,
					),
					'expected_src' => $googletagmanager_url,
				),
			),
		);
	}

	public function test_gtag_script_commands() {
		do_action( 'wp_enqueue_scripts' );

		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Test commands in the before position.
		$this->assertEquals( sprintf( 'gtag(%s");', '"' . static::TEST_COMMAND_1 . '","' . implode( '","', static::TEST_COMMAND_1_PARAMS ) ), $script->extra['before'][1], 'Before inline script should include first command call.' );

		// Test commands in the after position.
		$this->assertEquals( sprintf( 'gtag(%s);', '"' . static::TEST_COMMAND_2 . '",' . json_encode( static::TEST_COMMAND_2_PARAMS[0] ) ), $script->extra['after'][2], 'After inline script should include second command call.' );
	}

	public function test_gtag_with_tag_config() {
		$this->gtag->add_tag( static::TEST_TAG_ID_2, static::TEST_TAG_ID_2_CONFIG );

		do_action( 'wp_enqueue_scripts' );

		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		// Assert the array of inline script data contains the necessary gtag entry for the second script.
		// Should be in index 6, immediately after the first registered gtag.
		$this->assertEquals( 'gtag("config", "' . static::TEST_TAG_ID_2 . '", ' . json_encode( self::TEST_TAG_ID_2_CONFIG ) . ');', $script->extra['after'][6], 'Inline script should include config call for second tag with config.' );
	}

	public function test_get_gtag_src() {
		$this->assertEquals( 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_1, $this->gtag->get_gtag_src(), 'get_gtag_src should return src for first added tag.' );

		// Reset the GTag instance.
		$this->gtag = new GTag( $this->options );
		$this->gtag->register();

		// Verify that this returns `false` when no tags are added.
		$this->assertFalse( $this->gtag->get_gtag_src(), 'get_gtag_src should return false when no tags are added.' );

		// Add a different tag ID.
		$this->gtag->add_tag( static::TEST_TAG_ID_2 );

		// Verify that this returns the correct URL for the different tag ID.
		$this->assertEquals( 'https://www.googletagmanager.com/gtag/js?id=' . static::TEST_TAG_ID_2, $this->gtag->get_gtag_src(), 'get_gtag_src should return src for newly added tag.' );
	}

	/**
	 * @dataProvider provider_google_tag_gateway_data
	 */
	public function test_get_gtag_developer_id( $data ) {
		self::enable_feature( 'googleTagGateway' );

		$google_tag_gateway_settings = new Google_Tag_Gateway_Settings( $this->options );
		$google_tag_gateway_settings->set( $data['settings'] );

		do_action( 'wp_enqueue_scripts' );

		$scripts = wp_scripts();
		$script  = $scripts->registered[ GTag::HANDLE ];

		$this->assertEquals( 'gtag("set", "developer_id.dZTNiMT", true);', $script->extra['after'][4], 'Inline script should include developer id always.' );

		if ( $data['settings']['isEnabled'] && $data['settings']['isGTGHealthy'] && $data['settings']['isScriptAccessEnabled'] ) {
			$this->assertEquals( 'gtag("set", "developer_id.dZmZmYj", true);', $script->extra['after'][5], 'Inline script should include GTG developer id when conditions are met.' );
		} else {
			$this->assertNotContains( 'gtag("set", "developer_id.dZmZmYj", true);', $script->extra['after'], 'Inline script should not include GTG developer id when conditions are not met.' );
		}
	}

	public function test_hat_script_presence_in_wp_head__no_gtg() {
		$output = $this->capture_action( 'wp_head' ); // includes wp_enqueue_scripts

		$this->assertStringNotContainsString( 'google_tags_first_party', $output, 'HAT script should not be present without GTG enabled.' );
	}

	public function test_hat_script_presence_in_wp_head__with_gtg() {
		$this->enable_feature( 'googleTagGateway' );
		( new Google_Tag_Gateway_Settings( $this->options ) )->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => true,
			)
		);

		$output = $this->capture_action( 'wp_head' ); // includes wp_enqueue_scripts

		$this->assertStringContainsString( 'google_tags_first_party', $output, 'HAT script should be present when GTG is enabled and healthy with script access.' );
	}

	public function test_gtg_enqueues_script_per_tag() {
		$this->enable_feature( 'googleTagGateway' );
		( new Google_Tag_Gateway_Settings( $this->options ) )->set(
			array(
				'isEnabled'             => true,
				'isGTGHealthy'          => true,
				'isScriptAccessEnabled' => true,
			)
		);
		remove_all_filters( 'googlesitekit_setup_gtag' );
		remove_all_filters( 'wp_enqueue_scripts' );
		$gtag = new GTag( $this->options );
		$gtag->register();
		$gtag->add_tag( 'GT-98765' );
		$gtag->add_tag( 'AW-55555' );
		$gtag->add_tag( 'G-123456' );

		do_action( 'wp_enqueue_scripts' );

		$gtg_scripts = array_filter(
			wp_scripts()->registered,
			fn( $s ) => false !== strpos( $s->src, '/gtg/measurement.php' )
		);
		$gtg_handles = wp_list_pluck( $gtg_scripts, 'handle' );

		// Assert all added tags are registered with their own handles.
		$this->assertEqualSets(
			array(
				GTag::get_handle_for_tag( 'AW-55555' ),
				GTag::get_handle_for_tag( 'G-123456' ),
				GTag::get_handle_for_tag( 'GT-98765' ),
			),
			$gtg_handles,
			'GTG should register one handle per tag.'
		);

		// Assert all GTG handles are enqueued.
		$this->assertEquals(
			array(
				true,
				true,
				true,
			),
			array_map(
				fn ( $handle ) => wp_script_is( $handle, 'enqueued' ),
				array_values( $gtg_handles )
			),
			'All GTG handles should be enqueued.'
		);
	}
}
