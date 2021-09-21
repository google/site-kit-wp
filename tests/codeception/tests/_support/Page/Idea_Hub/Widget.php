<?php

namespace Page\Idea_Hub;

class Widget {

	public static function idea_row_id( $idea ) {
		return sprintf( '.googlesitekit-idea-hub__idea--single[data-id="%s"]', $idea['name'] );
	}

}
