<?php

namespace Google\Site_Kit\Core\Tags;

use Google\Site_Kit\Core\Util\BC_Functions;

class GTag_GTG extends GTag {
	public function register() {
		parent::register();

		add_action( 'wp_head', fn() => $this->print_hat_script(), 1 );
	}

	private function print_hat_script() {
		$tag_ids = wp_list_pluck( $this->tags, 'tag_id' );

		if ( ! $tag_ids ) {
			return;
		}

		$js = <<<'JS'
(function(w,i,g){w[g]=w[g]||[];if(typeof w[g].push=='function')w[g].push.apply(w[g],i)})
(window,%s,'google_tags_first_party');
JS;

		BC_Functions::wp_print_inline_script_tag(
			sprintf( $js, wp_json_encode( $tag_ids ) )
		);
	}

	protected function set_developer_id() {
		parent::set_developer_id();
		$this->add_command( 'set', array( 'developer_id.dZmZmYj', true ) );
	}

	protected function register_tags() {
		foreach ( $this->tags as $tag ) {
			$this->register_tag( $tag['tag_id'] );
		}
	}

	public function get_tag_src( $tag_id ) {
		return add_query_arg(
			array(
				'id' => $tag_id,
				's'  => '/gtag/js',
			),
			plugins_url( 'gtg/measurement.php', GOOGLESITEKIT_PLUGIN_MAIN_FILE )
		);
	}
}
