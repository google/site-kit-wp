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

namespace Google\Service\Webcontentpublisher;

class ListCtasResponse extends \Google\Collection
{
  protected $collection_key = 'ctas';
  protected $ctasType = Cta::class;
  protected $ctasDataType = 'array';
  /**
   * The next page token.
   *
   * @var string
   */
  public $nextPageToken;

  public function setCtas($ctas)
  {
    $this->ctas = $ctas;
  }
  public function getCtas()
  {
    return $this->ctas;
  }
  public function setNextPageToken($nextPageToken)
  {
    $this->nextPageToken = $nextPageToken;
  }
  public function getNextPageToken()
  {
    return $this->nextPageToken;
  }
}

class_alias(ListCtasResponse::class, 'Google_Service_Webcontentpublisher_ListCtasResponse');
