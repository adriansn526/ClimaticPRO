#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

# Test 1: Direct Arg paBtu (CamelCase)
echo "Testing paBtu: \"12000-btu\"..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(where: { paBtu: \"12000-btu\" }) { nodes { name } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"

# Test 2: Standard Category Slug
echo "Testing category: \"aer-conditionat\"..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(where: { category: \"aer-conditionat\" }) { nodes { name } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"

# Test 3: attribute: { slug: ... } 
echo "Testing attribute filter mock..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(where: { attribute: \"pa_btu\", attributeTerm: \"12000-btu\" }) { nodes { name } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
