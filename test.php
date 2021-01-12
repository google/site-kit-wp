<?php

# Check for valid contents.
if ($obj->contentsAreValid($array)) {
    $value = $obj->getValue();

    # Value needs to be an array.
    if (is_array($value) === false) {
        # Error.
        $obj->throwError();
        exit();
    }
}

?>