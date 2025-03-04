<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SearchConsole;

class ApiDataRow extends \Google\Collection
{
  protected $collection_key = 'keys';
  public $clicks;
  public $ctr;
  public $impressions;
  /**
   * @var string[]
   */
  public $keys;
  public $position;

  public function setClicks($clicks)
  {
    $this->clicks = $clicks;
  }
  public function getClicks()
  {
    return $this->clicks;
  }
  public function setCtr($ctr)
  {
    $this->ctr = $ctr;
  }
  public function getCtr()
  {
    return $this->ctr;
  }
  public function setImpressions($impressions)
  {
    $this->impressions = $impressions;
  }
  public function getImpressions()
  {
    return $this->impressions;
  }
  /**
   * @param string[]
   */
  public function setKeys($keys)
  {
    $this->keys = $keys;
  }
  /**
   * @return string[]
   */
  public function getKeys()
  {
    return $this->keys;
  }
  public function setPosition($position)
  {
    $this->position = $position;
  }
  public function getPosition()
  {
    return $this->position;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(ApiDataRow::class, 'Google_Service_SearchConsole_ApiDataRow');
