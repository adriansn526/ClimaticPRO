#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

# Test 1: PA_BTU Enum
echo "Testing terms(taxonomies: [PA_BTU])..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { terms(where: { taxonomies: [PA_BTU] }) { nodes { name slug count } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"

# Test 2: PABTU Enum
echo "Testing terms(taxonomies: [PABTU])..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { terms(where: { taxonomies: [PABTU] }) { nodes { name slug count } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"

# Test 3: PA_CAPACITATE Enum
echo "Testing terms(taxonomies: [PA_CAPACITATE])..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { terms(where: { taxonomies: [PA_CAPACITATE] }) { nodes { name slug count } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
