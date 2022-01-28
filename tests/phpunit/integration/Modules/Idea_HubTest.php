<?php
/**
 * Idea_HubTest
 *
 * @package   Google\Site_Kit\Tests\Modules
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Modules;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Admin\Notice;
use Google\Site_Kit\Core\Modules\Module_With_Scopes;
use Google\Site_Kit\Core\Modules\Module_With_Settings;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Modules\Idea_Hub\Settings;
use Google\Site_Kit\Modules\Idea_Hub\Post_Idea_Name;
use Google\Site_Kit\Modules\Idea_Hub\Post_Idea_Text;
use Google\Site_Kit\Modules\Idea_Hub\Post_Idea_Topics;
use Google\Site_Kit\Modules\Idea_Hub;
use Google\Site_Kit\Tests\Core\Modules\Module_With_Settings_ContractTests;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Modules
 */
class Idea_HubTest extends TestCase {
	use Module_With_Settings_ContractTests;

	/**
	 * Context instance.
	 *
	 * @var Context
	 */
	private $context;

	/**
	 * Idea_Hub instance.
	 *
	 * @var Idea_Hub
	 */
	private $idea_hub;

	public function setUp() {
		parent::setUp();

		$this->context  = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$this->idea_hub = new Idea_Hub( $this->context );
	}

	public function test_register() {
		remove_all_filters( 'googlesitekit_auth_scopes' );

		$this->idea_hub->register();

		// Adding required scopes.
		$this->assertEquals(
			$this->idea_hub->get_scopes(),
			apply_filters( 'googlesitekit_auth_scopes', array() )
		);
	}

	public function test_register_persistent() {
		remove_all_filters( 'display_post_states' );

		$this->assertFalse( has_filter( 'display_post_states' ) );
		$this->assertFalse( has_filter( 'wp_insert_post_empty_content' ) );

		$this->idea_hub->register_persistent();

		$this->assertTrue( has_filter( 'display_post_states' ) );
		$this->assertTrue( has_filter( 'wp_insert_post_empty_content' ) );
	}

	public function test_register__notices() {
		remove_all_filters( 'googlesitekit_admin_notices' );
		// Connect the module before registering.
		$this->idea_hub->get_settings()->register();
		$this->idea_hub->get_settings()->merge(
			array( 'tosAccepted' => true )
		);
		$this->idea_hub->register();

		$this->assertFalse( $this->get_notice( 'idea-hub_saved-ideas' ) );
		$this->assertFalse( $this->get_notice( 'idea-hub_new-ideas' ) );

		// Notices are only registered on the posts page.
		set_current_screen( 'edit.php' );

		$this->assertInstanceOf( Notice::class, $this->get_notice( 'idea-hub_saved-ideas' ) );
		$this->assertInstanceOf( Notice::class, $this->get_notice( 'idea-hub_new-ideas' ) );
	}

	public function test_get_scopes() {
		$this->assertEqualSets(
			array(
				'https://www.googleapis.com/auth/ideahub.read',
				'https://www.googleapis.com/auth/ideahub.full',
			),
			$this->idea_hub->get_scopes()
		);
	}

	public function test_is_connected() {
		$options  = new Options( $this->context );
		$idea_hub = new Idea_Hub( $this->context, $options );

		$options->set(
			Settings::OPTION,
			array( 'tosAccepted' => true )
		);

		$this->assertTrue( $idea_hub->is_connected() );
	}

	public function test_idea_hub_labels() {
		$draft_idea_hub_post_with_no_title = $this->factory()->post->create_and_get(
			array(
				'post_status' => 'draft',
				'post_title'  => '',
			)
		);
		$topics                            = array(
			array(
				'mid'          => '/m/05z6w',
				'display_name' => 'Penguins',
			),
		);
		add_post_meta( $draft_idea_hub_post_with_no_title->ID, 'googlesitekitpersistent_idea_name', 'ideas/2285812891948871921' );
		add_post_meta( $draft_idea_hub_post_with_no_title->ID, 'googlesitekitpersistent_idea_text', 'Using Site Kit to analyze your success' );
		add_post_meta( $draft_idea_hub_post_with_no_title->ID, 'googlesitekitpersistent_idea_topics', $topics );
		$post_states_for_draft_post_with_no_title = apply_filters( 'display_post_states', array( 'draft' => 'Draft' ), $draft_idea_hub_post_with_no_title );

		// Idea Hub module is not enabled yet.
		$this->assertEquals( $post_states_for_draft_post_with_no_title, array( 'draft' => 'Draft' ) );

		// Connect the module
		$options  = new Options( $this->context );
		$idea_hub = new Idea_Hub( $this->context, $options );

		$options->set(
			Settings::OPTION,
			array( 'tosAccepted' => true )
		);

		// Create the post
		$published_idea_hub_post_with_title = $this->factory()->post->create_and_get(
			array(
				'post_status' => 'publish',
				'post_title'  => 'foo',
			)
		);
		$draft_post_not_idea_hub            = $this->factory()->post->create_and_get( array( 'post_status' => 'draft' ) );
		$idea                               = array(
			'name'   => 'ideas/17450692223393508734',
			'text'   => 'Why Penguins are guanotelic?',
			'topics' => array(
				'/m/05z6w' => 'Penguins',
			),
		);

		$this->idea_hub->register_persistent();
		$this->idea_hub->register();
		$this->idea_hub->set_post_idea( $published_idea_hub_post_with_title->ID, $idea );

		// With an IdeaHub post
		$post_states_for_published_post_with_title = apply_filters( 'display_post_states', array( 'idea-hub' => 'inspired by Idea Hub' ), $published_idea_hub_post_with_title );
		// With a regular draft post
		$post_states_for_draft_non_idea_hub_post = apply_filters( 'display_post_states', array( 'draft' => 'Draft' ), $draft_post_not_idea_hub );

		$post_states_for_draft_post_with_no_title = apply_filters( 'display_post_states', array( 'draft' => 'Draft' ), $draft_idea_hub_post_with_no_title );

		$this->assertEquals( $post_states_for_draft_post_with_no_title, array( 'draft' => 'Idea Hub Draft “Using Site Kit to analyze your success”' ) );
		$this->assertEquals( $post_states_for_published_post_with_title, array( 'idea-hub' => 'inspired by Idea Hub' ) );
		$this->assertEquals( $post_states_for_draft_non_idea_hub_post, array( 'draft' => 'Draft' ) );
	}

	public function test_is_idea_post() {
		// Ensure we don't have the filter set.
		remove_all_filters( 'wp_insert_post_empty_content' );

		// Create an empty post that we can't trash.
		add_filter( 'wp_insert_post_empty_content', '__return_false' );
		$post_id = wp_insert_post( array(), false );
		remove_filter( 'wp_insert_post_empty_content', '__return_false' );

		$this->assertFalse( has_filter( 'wp_insert_post_empty_content' ) );

		// Connect the Idea Hub module.
		$options = new Options( $this->context );
		$options->set(
			Settings::OPTION,
			array( 'tosAccepted' => true )
		);
		$idea_hub = new Idea_Hub( $this->context, $options );

		$idea_hub->register_persistent();
		$idea_hub->register();

		$this->assertTrue( has_filter( 'wp_insert_post_empty_content' ) );

		// Trashing this post fails silently, because it isn't an Idea Hub
		// post and it has no content.
		// See: https://github.com/google/site-kit-wp/issues/3514.
		wp_trash_post( $post_id );

		// Ensure that we couldn't trash the empty post.
		$this->assertEquals( get_post_status( $post_id ), 'draft' );

		$idea = array(
			'name'   => 'ideas/17450692223393508734',
			'text'   => 'Why Penguins are guanotelic?',
			'topics' => array(
				'/m/05z6w' => 'Penguins',
			),
		);

		$idea_hub->set_post_idea( $post_id, $idea );

		// This succeeds as the post is now an idea post.
		wp_trash_post( $post_id );

		// Ensure that we can trash an empty Idea Hub post.
		$this->assertEquals( get_post_status( $post_id ), 'trash' );
	}

	public function test_on_deactivation() {
		$options = new Options( $this->context );
		$options->set( Settings::OPTION, 'test-value' );

		$idea_hub = new Idea_Hub( $this->context, $options );
		$idea_hub->on_deactivation();

		$this->assertOptionNotExists( Settings::OPTION );
	}

	public function test_get_datapoints() {
		$this->assertEqualSets(
			array(
				'draft-post-ideas',
				'new-ideas',
				'published-post-ideas',
				'saved-ideas',
				'create-idea-draft-post',
				'update-idea-state',
			),
			$this->idea_hub->get_datapoints()
		);
	}

	public function test_set_post_idea() {
		$post_id = $this->factory()->post->create();
		$idea    = array(
			'name'   => 'ideas/17450692223393508734',
			'text'   => 'Why Penguins are guanotelic?',
			'topics' => array(
				'/m/05z6w' => 'Penguins',
			),
		);

		$this->idea_hub->register();
		$this->idea_hub->set_post_idea( $post_id, $idea );

		$this->assertPostMetaExists( $post_id, Post_Idea_Name::META_KEY );
		$this->assertPostMetaExists( $post_id, Post_Idea_Text::META_KEY );
		$this->assertPostMetaExists( $post_id, Post_Idea_Topics::META_KEY );

		$this->assertPostMetaHasValue( $post_id, Post_Idea_Name::META_KEY, $idea['name'] );
		$this->assertPostMetaHasValue( $post_id, Post_Idea_Text::META_KEY, $idea['text'] );
		$this->assertPostMetaHasValue( $post_id, Post_Idea_Topics::META_KEY, serialize( $idea['topics'] ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
	}

	public function test_get_post_idea() {
		global $wpdb;

		$post_id = $this->factory()->post->create();
		$name    = 'ideas/14025103994557865535';
		$text    = 'When was sushi Kalam introduced?';
		$mid     = '/m/07030';
		$topics  = array(
			$mid => 'Sushi',
		);

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => Post_Idea_Name::META_KEY,
				'meta_value' => $name,
			)
		);

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => Post_Idea_Text::META_KEY,
				'meta_value' => $text,
			)
		);

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => Post_Idea_Topics::META_KEY,
				'meta_value' => serialize( $topics ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
			)
		);

		$this->idea_hub->register();

		$idea = $this->idea_hub->get_post_idea( $post_id );
		$this->assertTrue( is_array( $idea ) );

		$this->assertArrayHasKey( 'name', $idea );
		$this->assertEquals( $name, $idea['name'] );

		$this->assertArrayHasKey( 'text', $idea );
		$this->assertEquals( $text, $idea['text'] );

		$this->assertArrayHasKey( 'topics', $idea );
		$this->assertTrue( is_array( $idea['topics'] ) );
		$this->assertArrayHasKey( $mid, $idea['topics'] );
		$this->assertEquals( $topics[ $mid ], $idea['topics'][ $mid ] );
	}

	public function test_get_post_idea__insufficient_data() {
		global $wpdb;

		$post_id = $this->factory()->post->create();
		$name    = 'ideas/14025103994557865535';
		$mid     = '/m/07030';
		$topics  = array(
			$mid => 'Sushi',
		);

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => Post_Idea_Name::META_KEY,
				'meta_value' => $name,
			)
		);

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $post_id,
				'meta_key'   => Post_Idea_Topics::META_KEY,
				'meta_value' => serialize( $topics ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
			)
		);

		$this->idea_hub->register();

		$idea = $this->idea_hub->get_post_idea( $post_id );
		$this->assertNull( $idea );
	}

	/**
	 * Gets a registered notice by the given slug or fails.
	 *
	 * @param string $slug Notice slug.
	 * @return Notice|bool
	 */
	protected function get_notice( $slug ) {
		$notices = apply_filters( 'googlesitekit_admin_notices', array() );

		foreach ( $notices as $notice ) {
			if ( $notice->get_slug() === $slug ) {
				return $notice;
			}
		}

		return false;
	}

	/**
	 * @return Module_With_Scopes
	 */
	protected function get_module_with_scopes() {
		return new Idea_Hub( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}

	/**
	 * @return Module_With_Settings
	 */
	protected function get_module_with_settings() {
		return new Idea_Hub( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
	}
}
