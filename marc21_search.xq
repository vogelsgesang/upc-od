xquery version "3.0";

(: the namespace definition :)
declare default element namespace "http://www.loc.gov/MARC21/slim";

(: builds a string containing all the XPath conditions based on the GET parameters :)
declare function local:buildConditions() as xs:string {
  string-join(
    for $param_name in request:get-parameter-names()
    where matches($param_name, "^[0-9]{3}.?$")
      return
      let $cond_tag := substring($param_name, 1, 3)
      let $cond_subfield := substring($param_name, 4, 1)
      for $i in (1 to count(request:get-parameter($param_name, ())))
      return
        if ($cond_subfield eq '')
        then concat("[controlfield[@tag = '", $cond_tag, "']/text() = request:get-parameter('", $param_name, "',())[", $i,']]')
        else concat("[datafield[@tag = '", $cond_tag, "']/subfield[@code='", $cond_subfield,"']/text() = request:get-parameter('", $param_name, "',())[", $i,']]')
    ,
    ''
  )
};

(: gets the offsets and ensures a valid value :)
declare function local:getOffset() as xs:integer {
  let $offset := xs:int(request:get-parameter('offset', 0))
  return
    if ($offset gt 0)
    then $offset
    else 0
};

(: returns the limit. The limit is clamped to the range 0-100 :)
declare function local:getLimit() as xs:integer {
  let $limit := xs:int(request:get-parameter('limit', 20))
  return
    if ($limit gt 0 and $limit le 100)
    then $limit
    else 20
};

(: return a string representing the query with added limits... :)
declare function local:buildLimitedSearchQuery($conditions as xs:string, $offset as xs:integer, $limit as xs:integer) as xs:string {
  let $query := concat(
    'subsequence(doc("/db/od/books_export.xml")/collection/record',
    $conditions, ',', 1+$offset, ',', $limit,')'
  )
  return $query
};

<collection>{
  util:eval(local:buildLimitedSearchQuery(local:buildConditions(), local:getOffset(), local:getLimit()))
}</collection>

