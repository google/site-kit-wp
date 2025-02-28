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

namespace Google\Service\PagespeedInsights;

class AuditRefs extends \Google\Collection
{
  protected $collection_key = 'relevantAudits';
  /**
   * @var string
   */
  public $acronym;
  /**
   * @var string
   */
  public $group;
  /**
   * @var string
   */
  public $id;
  /**
   * @var string[]
   */
  public $relevantAudits;
  public $weight;

  /**
   * @param string
   */
  public function setAcronym($acronym)
  {
    $this->acronym = $acronym;
  }
  /**
   * @return string
   */
  public function getAcronym()
  {
    return $this->acronym;
  }
  /**
   * @param string
   */
  public function setGroup($group)
  {
    $this->group = $group;
  }
  /**
   * @return string
   */
  public function getGroup()
  {
    return $this->group;
  }
  /**
   * @param string
   */
  public function setId($id)
  {
    $this->id = $id;
  }
  /**
   * @return string
   */
  public function getId()
  {
    return $this->id;
  }
  /**
   * @param string[]
   */
  public function setRelevantAudits($relevantAudits)
  {
    $this->relevantAudits = $relevantAudits;
  }
  /**
   * @return string[]
   */
  public function getRelevantAudits()
  {
    return $this->relevantAudits;
  }
  public function setWeight($weight)
  {
    $this->weight = $weight;
  }
  public function getWeight()
  {
    return $this->weight;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(AuditRefs::class, 'Google_Service_PagespeedInsights_AuditRefs');
